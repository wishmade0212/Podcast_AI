/**
 * Migrate Local Files to Google Cloud Storage
 * Uploads all files from uploads/ directory to GCS and updates database
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const cloudStorage = require('./services/cloudStorage');
const Document = require('./models/Document');
const Podcast = require('./models/Podcast');
require('dotenv').config();

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`),
  progress: (msg) => process.stdout.write(`${colors.cyan}⏳${colors.reset} ${msg}\r`)
};

// Migration statistics
const stats = {
  documents: { found: 0, uploaded: 0, updated: 0, skipped: 0, failed: 0 },
  audio: { found: 0, uploaded: 0, updated: 0, skipped: 0, failed: 0 }
};

/**
 * Check if directory exists
 */
async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get all files in directory recursively
 */
async function getAllFiles(dirPath, fileList = []) {
  try {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }
    
    return fileList;
  } catch (error) {
    log.error(`Failed to read directory ${dirPath}: ${error.message}`);
    return fileList;
  }
}

/**
 * Migrate document files to GCS
 */
async function migrateDocuments() {
  log.title('📄 Migrating Document Files');
  
  const uploadsDir = path.join(__dirname, 'uploads', 'documents');
  
  // Check if directory exists
  if (!(await dirExists(uploadsDir))) {
    log.warning('No uploads/documents directory found');
    return;
  }
  
  // Get all files
  const files = await getAllFiles(uploadsDir);
  stats.documents.found = files.length;
  
  if (files.length === 0) {
    log.warning('No document files to migrate');
    return;
  }
  
  log.info(`Found ${files.length} document file(s)`);
  
  // Migrate each file
  for (let i = 0; i < files.length; i++) {
    const localPath = files[i];
    const relativePath = path.relative(uploadsDir, localPath);
    const fileName = path.basename(localPath);
    
    log.progress(`[${i + 1}/${files.length}] Uploading ${fileName}...`);
    
    try {
      // Find document in database by file path
      const docFileName = relativePath.replace(/\\/g, '/');
      const document = await Document.findOne({
        $or: [
          { filePath: docFileName },
          { filePath: `uploads/documents/${docFileName}` },
          { fileName: fileName }
        ]
      });
      
      if (!document) {
        log.warning(`\nNo database record found for ${fileName}, skipping`);
        stats.documents.skipped++;
        continue;
      }
      
      // Generate GCS path
      const gcsPath = cloudStorage.generateFilePath(
        document.userId.toString(),
        fileName,
        'document'
      );
      
      // Upload to GCS
      const signedUrl = await cloudStorage.uploadFile(
        localPath,
        gcsPath,
        'documents'
      );
      
      stats.documents.uploaded++;
      
      // Update database record
      document.filePath = gcsPath;
      document.fileUrl = signedUrl;
      document.storageType = 'gcs';
      await document.save();
      
      stats.documents.updated++;
      log.success(`\nMigrated: ${fileName} → ${gcsPath}`);
      
    } catch (error) {
      stats.documents.failed++;
      log.error(`\nFailed to migrate ${fileName}: ${error.message}`);
    }
  }
}

/**
 * Migrate audio files to GCS
 */
async function migrateAudio() {
  log.title('🎵 Migrating Audio Files');
  
  const uploadsDir = path.join(__dirname, 'uploads', 'audio');
  
  // Check if directory exists
  if (!(await dirExists(uploadsDir))) {
    log.warning('No uploads/audio directory found');
    return;
  }
  
  // Get all files
  const files = await getAllFiles(uploadsDir);
  stats.audio.found = files.length;
  
  if (files.length === 0) {
    log.warning('No audio files to migrate');
    return;
  }
  
  log.info(`Found ${files.length} audio file(s)`);
  
  // Migrate each file
  for (let i = 0; i < files.length; i++) {
    const localPath = files[i];
    const fileName = path.basename(localPath);
    const fileNameWithoutExt = path.parse(fileName).name;
    
    log.progress(`[${i + 1}/${files.length}] Uploading ${fileName}...`);
    
    try {
      // Find podcast in database by audio URL or filename
      const podcast = await Podcast.findOne({
        $or: [
          { audioUrl: { $regex: fileNameWithoutExt } },
          { audioUrl: `uploads/audio/${fileName}` }
        ]
      });
      
      if (!podcast) {
        log.warning(`\nNo database record found for ${fileName}, skipping`);
        stats.audio.skipped++;
        continue;
      }
      
      // Generate GCS path
      const gcsPath = cloudStorage.generateFilePath(
        podcast.userId.toString(),
        fileName,
        'audio'
      );
      
      // Upload to GCS
      const signedUrl = await cloudStorage.uploadFile(
        localPath,
        gcsPath,
        'audio',
        { contentType: 'audio/mpeg' }
      );
      
      stats.audio.uploaded++;
      
      // Update database record
      podcast.audioUrl = gcsPath;
      podcast.audioSignedUrl = signedUrl;
      podcast.storageType = 'gcs';
      await podcast.save();
      
      stats.audio.updated++;
      log.success(`\nMigrated: ${fileName} → ${gcsPath}`);
      
    } catch (error) {
      stats.audio.failed++;
      log.error(`\nFailed to migrate ${fileName}: ${error.message}`);
    }
  }
}

/**
 * Create backup of local files
 */
async function createBackup() {
  log.title('💾 Creating Backup');
  
  const backupDir = path.join(__dirname, 'uploads-backup-' + Date.now());
  const uploadsDir = path.join(__dirname, 'uploads');
  
  try {
    // Copy uploads directory to backup
    await fs.cp(uploadsDir, backupDir, { recursive: true });
    log.success(`Backup created: ${backupDir}`);
    log.warning('Keep this backup until you verify migration is successful');
    return true;
  } catch (error) {
    log.error(`Backup failed: ${error.message}`);
    log.warning('Continuing without backup (risky!)');
    return false;
  }
}

/**
 * Verify migration
 */
async function verifyMigration() {
  log.title('🔍 Verifying Migration');
  
  try {
    // Check documents
    const docsWithGCS = await Document.countDocuments({ storageType: 'gcs' });
    const docsTotal = await Document.countDocuments();
    log.info(`Documents: ${docsWithGCS}/${docsTotal} migrated to GCS`);
    
    // Check podcasts
    const podcastsWithGCS = await Podcast.countDocuments({ storageType: 'gcs' });
    const podcastsTotal = await Podcast.countDocuments();
    log.info(`Podcasts: ${podcastsWithGCS}/${podcastsTotal} migrated to GCS`);
    
    // Check GCS files
    const gcsDocFiles = await cloudStorage.listFiles('', 'documents');
    const gcsAudioFiles = await cloudStorage.listFiles('', 'audio');
    log.info(`GCS Documents: ${gcsDocFiles.length} files`);
    log.info(`GCS Audio: ${gcsAudioFiles.length} files`);
    
    return true;
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n' + '='.repeat(60));
  log.title('🚀 Local Files to Google Cloud Storage Migration');
  console.log('='.repeat(60));
  
  log.warning('⚠️  IMPORTANT: This will upload all local files to Google Cloud Storage');
  log.info('Files will remain on local disk (safe migration)');
  log.info('Database records will be updated with GCS URLs\n');
  
  try {
    // Connect to MongoDB
    log.title('🔌 Connecting to Database');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log.success('Connected to MongoDB');
    
    // Create backup
    await createBackup();
    
    // Migrate files
    await migrateDocuments();
    await migrateAudio();
    
    // Verify migration
    await verifyMigration();
    
    // Print summary
    log.title('📊 Migration Summary');
    
    console.log('\n📄 Documents:');
    console.table(stats.documents);
    
    console.log('\n🎵 Audio:');
    console.table(stats.audio);
    
    const totalUploaded = stats.documents.uploaded + stats.audio.uploaded;
    const totalUpdated = stats.documents.updated + stats.audio.updated;
    const totalFailed = stats.documents.failed + stats.audio.failed;
    
    if (totalFailed === 0 && totalUploaded > 0) {
      log.title('✅ Migration Completed Successfully!');
      log.success(`${totalUploaded} files uploaded to Google Cloud Storage`);
      log.success(`${totalUpdated} database records updated`);
      log.info('\nNext steps:');
      log.info('1. Test your application with cloud storage');
      log.info('2. Verify files are accessible');
      log.info('3. Update code to use cloudStorage service');
      log.info('4. Once verified, you can delete local uploads/ directory');
      log.warning('5. Keep the backup until everything is working!');
    } else if (totalFailed > 0) {
      log.warning(`\n⚠️ Migration completed with ${totalFailed} errors`);
      log.info('Check the errors above and retry failed files');
    } else {
      log.warning('\n⚠️ No files were migrated');
      log.info('This might be normal if:');
      log.info('- uploads/ directory is empty');
      log.info('- Files already migrated');
      log.info('- Database has no matching records');
    }
    
  } catch (error) {
    log.error(`\n❌ Migration Failed!`);
    log.error(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log.info('\nDatabase connection closed');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
}

// Run migration
migrate();
