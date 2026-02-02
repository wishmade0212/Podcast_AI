/**
 * MongoDB Atlas Migration Script
 * Migrates data from local MongoDB to MongoDB Atlas cloud database
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Document = require('./models/Document');
const Summary = require('./models/Summary');
const Podcast = require('./models/Podcast');

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`)
};

// Configuration
const LOCAL_URI = 'mongodb://localhost:27017/podcast-generator';
const ATLAS_URI = process.env.MONGODB_URI;

// Check if Atlas URI is configured
if (!ATLAS_URI || ATLAS_URI.includes('localhost')) {
  log.error('MongoDB Atlas URI not configured in .env file!');
  log.warning('Please update MONGODB_URI in .env with your Atlas connection string');
  log.info('Format: mongodb+srv://username:password@cluster.mongodb.net/podcast-generator');
  process.exit(1);
}

// Migration statistics
const stats = {
  users: { local: 0, migrated: 0, skipped: 0 },
  documents: { local: 0, migrated: 0, skipped: 0 },
  summaries: { local: 0, migrated: 0, skipped: 0 },
  podcasts: { local: 0, migrated: 0, skipped: 0 }
};

/**
 * Connect to both databases
 */
async function connectDatabases() {
  log.title('🔌 Connecting to Databases');
  
  try {
    // Create separate connections
    const localConn = await mongoose.createConnection(LOCAL_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log.success('Connected to local MongoDB');

    const atlasConn = await mongoose.createConnection(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log.success('Connected to MongoDB Atlas');

    return { localConn, atlasConn };
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    throw error;
  }
}

/**
 * Migrate collection data
 */
async function migrateCollection(localModel, atlasModel, collectionName) {
  log.title(`📦 Migrating ${collectionName}`);

  try {
    // Fetch all documents from local
    const localDocs = await localModel.find({}).lean();
    stats[collectionName].local = localDocs.length;
    log.info(`Found ${localDocs.length} ${collectionName} in local database`);

    if (localDocs.length === 0) {
      log.warning(`No ${collectionName} to migrate`);
      return;
    }

    // Check existing documents in Atlas
    const existingDocs = await atlasModel.find({}).lean();
    const existingIds = new Set(existingDocs.map(doc => doc._id.toString()));
    log.info(`Found ${existingDocs.length} existing ${collectionName} in Atlas`);

    // Migrate each document
    for (const doc of localDocs) {
      const docId = doc._id.toString();
      
      if (existingIds.has(docId)) {
        log.warning(`${collectionName} ${docId} already exists, skipping`);
        stats[collectionName].skipped++;
        continue;
      }

      try {
        await atlasModel.create(doc);
        log.success(`Migrated ${collectionName}: ${docId}`);
        stats[collectionName].migrated++;
      } catch (error) {
        log.error(`Failed to migrate ${docId}: ${error.message}`);
      }
    }

    log.success(`✨ ${collectionName} migration complete!`);
    log.info(`Migrated: ${stats[collectionName].migrated}, Skipped: ${stats[collectionName].skipped}`);
  } catch (error) {
    log.error(`Migration failed for ${collectionName}: ${error.message}`);
    throw error;
  }
}

/**
 * Verify migration
 */
async function verifyMigration(localConn, atlasConn) {
  log.title('🔍 Verifying Migration');

  const collections = ['users', 'documents', 'summaries', 'podcasts'];
  
  for (const collection of collections) {
    const localCount = await localConn.collection(collection).countDocuments();
    const atlasCount = await atlasConn.collection(collection).countDocuments();
    
    if (atlasCount >= localCount) {
      log.success(`${collection}: ${atlasCount} documents in Atlas (${localCount} in local)`);
    } else {
      log.warning(`${collection}: ${atlasCount} documents in Atlas (${localCount} in local) - Some documents may not have migrated`);
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n' + '='.repeat(60));
  log.title('🚀 MongoDB Atlas Migration Tool');
  console.log('='.repeat(60));

  log.info('This script will migrate your local MongoDB data to Atlas');
  log.warning('Existing documents in Atlas will be skipped');
  log.info('Local database will remain unchanged\n');

  let localConn, atlasConn;

  try {
    // Connect to databases
    const connections = await connectDatabases();
    localConn = connections.localConn;
    atlasConn = connections.atlasConn;

    // Create models for each connection
    const LocalUser = localConn.model('User', User.schema);
    const AtlasUser = atlasConn.model('User', User.schema);

    const LocalDocument = localConn.model('Document', Document.schema);
    const AtlasDocument = atlasConn.model('Document', Document.schema);

    const LocalSummary = localConn.model('Summary', Summary.schema);
    const AtlasSummary = atlasConn.model('Summary', Summary.schema);

    const LocalPodcast = localConn.model('Podcast', Podcast.schema);
    const AtlasPodcast = atlasConn.model('Podcast', Podcast.schema);

    // Migrate collections
    await migrateCollection(LocalUser, AtlasUser, 'users');
    await migrateCollection(LocalDocument, AtlasDocument, 'documents');
    await migrateCollection(LocalSummary, AtlasSummary, 'summaries');
    await migrateCollection(LocalPodcast, AtlasPodcast, 'podcasts');

    // Verify migration
    await verifyMigration(localConn.db, atlasConn.db);

    // Print summary
    log.title('📊 Migration Summary');
    console.table({
      'Users': stats.users,
      'Documents': stats.documents,
      'Summaries': stats.summaries,
      'Podcasts': stats.podcasts
    });

    log.success('\n✨ Migration completed successfully!');
    log.info('Your data is now in MongoDB Atlas');
    log.warning('⚠️  IMPORTANT: Local files (uploads/) need to be migrated to Google Cloud Storage separately');
    log.info('Run the next migration script to move files to cloud storage\n');

  } catch (error) {
    log.error(`\nMigration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close connections
    if (localConn) {
      await localConn.close();
      log.info('Closed local database connection');
    }
    if (atlasConn) {
      await atlasConn.close();
      log.info('Closed Atlas database connection');
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
}

// Run migration
migrate();
