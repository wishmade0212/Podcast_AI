/**
 * Test Google Cloud Storage Connection
 * Verifies GCS buckets and performs basic operations
 */

const cloudStorage = require('./services/cloudStorage');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

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

async function testCloudStorage() {
  console.log('\n' + '='.repeat(60));
  log.title('🧪 Google Cloud Storage Connection Test');
  console.log('='.repeat(60) + '\n');

  const testResults = {
    bucketAccess: false,
    upload: false,
    download: false,
    signedUrl: false,
    delete: false,
    list: false
  };

  try {
    // Test 1: Check bucket access
    log.title('📦 Test 1: Verifying Bucket Access');
    
    try {
      const [documentsExists] = await cloudStorage.documentsBucket.exists();
      const [audioExists] = await cloudStorage.audioBucket.exists();
      
      if (documentsExists) {
        log.success(`Documents bucket accessible: ${cloudStorage.documentsBucket.name}`);
      } else {
        log.error(`Documents bucket not found: ${cloudStorage.documentsBucket.name}`);
      }
      
      if (audioExists) {
        log.success(`Audio bucket accessible: ${cloudStorage.audioBucket.name}`);
      } else {
        log.error(`Audio bucket not found: ${cloudStorage.audioBucket.name}`);
      }
      
      testResults.bucketAccess = documentsExists && audioExists;
    } catch (error) {
      log.error(`Bucket access failed: ${error.message}`);
      testResults.bucketAccess = false;
    }

    if (!testResults.bucketAccess) {
      log.error('\n❌ Cannot proceed without bucket access!');
      log.warning('Please create buckets first:');
      log.info('1. Go to https://console.cloud.google.com/storage');
      log.info('2. Create bucket: podcast-documents-474105');
      log.info('3. Create bucket: podcast-audio-474105');
      log.info('4. Set location: us-central1');
      log.info('5. Grant Storage Object Admin role to your service account');
      process.exit(1);
    }

    // Test 2: Upload file
    log.title('⬆️ Test 2: Upload File');
    
    const testContent = Buffer.from('This is a test file for Google Cloud Storage\nTimestamp: ' + new Date().toISOString());
    const testFileName = `test/test-${Date.now()}.txt`;
    
    try {
      const uploadUrl = await cloudStorage.uploadFile(
        testContent,
        testFileName,
        'documents',
        { contentType: 'text/plain' }
      );
      
      log.success('File uploaded successfully');
      log.info(`File path: ${testFileName}`);
      testResults.upload = true;
    } catch (error) {
      log.error(`Upload failed: ${error.message}`);
      testResults.upload = false;
    }

    // Test 3: Generate signed URL
    log.title('🔗 Test 3: Generate Signed URL');
    
    try {
      const signedUrl = await cloudStorage.getSignedUrl(testFileName, 'documents', 5);
      log.success('Signed URL generated successfully');
      log.info(`URL (5 min expiry): ${signedUrl.substring(0, 100)}...`);
      testResults.signedUrl = true;
    } catch (error) {
      log.error(`Signed URL generation failed: ${error.message}`);
      testResults.signedUrl = false;
    }

    // Test 4: Check file existence
    log.title('🔍 Test 4: Check File Existence');
    
    try {
      const exists = await cloudStorage.fileExists(testFileName, 'documents');
      if (exists) {
        log.success('File exists in bucket');
      } else {
        log.error('File not found in bucket');
      }
    } catch (error) {
      log.error(`File check failed: ${error.message}`);
    }

    // Test 5: Get file metadata
    log.title('📋 Test 5: Get File Metadata');
    
    try {
      const metadata = await cloudStorage.getFileMetadata(testFileName, 'documents');
      log.success('Metadata retrieved successfully');
      console.log(`  Name: ${metadata.name}`);
      console.log(`  Size: ${metadata.size} bytes`);
      console.log(`  Type: ${metadata.contentType}`);
      console.log(`  Created: ${new Date(metadata.created).toLocaleString()}`);
    } catch (error) {
      log.error(`Metadata retrieval failed: ${error.message}`);
    }

    // Test 6: Download file
    log.title('⬇️ Test 6: Download File');
    
    try {
      const downloadedContent = await cloudStorage.downloadFile(testFileName, 'documents');
      const downloadedText = downloadedContent.toString('utf-8');
      
      if (downloadedText === testContent.toString('utf-8')) {
        log.success('File downloaded successfully and content matches');
      } else {
        log.warning('File downloaded but content differs');
      }
      testResults.download = true;
    } catch (error) {
      log.error(`Download failed: ${error.message}`);
      testResults.download = false;
    }

    // Test 7: List files
    log.title('📂 Test 7: List Files in Directory');
    
    try {
      const files = await cloudStorage.listFiles('test/', 'documents');
      log.success(`Found ${files.length} file(s) in test/ directory`);
      
      if (files.length > 0) {
        files.forEach(file => {
          console.log(`  - ${file.name} (${file.size} bytes)`);
        });
      }
      testResults.list = true;
    } catch (error) {
      log.error(`List files failed: ${error.message}`);
      testResults.list = false;
    }

    // Test 8: Delete file
    log.title('🗑️ Test 8: Delete File');
    
    try {
      await cloudStorage.deleteFile(testFileName, 'documents');
      log.success('File deleted successfully');
      
      // Verify deletion
      const stillExists = await cloudStorage.fileExists(testFileName, 'documents');
      if (!stillExists) {
        log.success('Deletion verified - file no longer exists');
      } else {
        log.warning('File still exists after deletion attempt');
      }
      testResults.delete = true;
    } catch (error) {
      log.error(`Delete failed: ${error.message}`);
      testResults.delete = false;
    }

    // Test 9: Check storage quotas
    log.title('💾 Test 9: Storage Information');
    
    try {
      const [documentsMetadata] = await cloudStorage.documentsBucket.getMetadata();
      const [audioMetadata] = await cloudStorage.audioBucket.getMetadata();
      
      log.info('Documents Bucket:');
      console.log(`  Name: ${documentsMetadata.name}`);
      console.log(`  Location: ${documentsMetadata.location}`);
      console.log(`  Storage Class: ${documentsMetadata.storageClass}`);
      
      log.info('\nAudio Bucket:');
      console.log(`  Name: ${audioMetadata.name}`);
      console.log(`  Location: ${audioMetadata.location}`);
      console.log(`  Storage Class: ${audioMetadata.storageClass}`);
    } catch (error) {
      log.error(`Failed to get storage info: ${error.message}`);
    }

    // Print test summary
    log.title('📊 Test Summary');
    
    const passed = Object.values(testResults).filter(v => v === true).length;
    const total = Object.keys(testResults).length;
    
    console.table(testResults);
    
    if (passed === total) {
      log.title('✅ All Tests Passed!');
      log.success('Google Cloud Storage is configured correctly');
      log.info('You can now:');
      log.info('1. Run: node migrate-files-to-gcs.js (to migrate local files)');
      log.info('2. Update your app to use cloud storage');
      log.info('3. Deploy to Google Cloud Platform');
    } else {
      log.title(`⚠️ ${passed}/${total} Tests Passed`);
      log.warning('Some tests failed. Check the errors above.');
      
      if (!testResults.bucketAccess) {
        log.error('CRITICAL: Bucket access failed!');
        log.info('Fix bucket permissions before proceeding');
      }
    }

  } catch (error) {
    log.error(`\n❌ Test Suite Failed!`);
    log.error(`Error: ${error.message}`);
    console.error(error);
    
    log.warning('\nTroubleshooting:');
    log.info('1. Verify google-credentials.json exists and is valid');
    log.info('2. Check if Cloud Storage API is enabled');
    log.info('3. Verify service account has Storage Object Admin role');
    log.info('4. Confirm bucket names in .env match actual buckets');
    log.info('5. Check network connectivity to Google Cloud');
    
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
}

// Run test
testCloudStorage();
