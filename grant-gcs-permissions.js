/**
 * Grant Google Cloud Storage permissions to service account
 */

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, 'google-credentials.json')
});

// Read credentials to get service account email
const credentials = JSON.parse(fs.readFileSync('google-credentials.json', 'utf8'));
const serviceAccount = credentials.client_email;

// Bucket names from .env
const DOCUMENTS_BUCKET = 'podcast-documents-474105';
const AUDIO_BUCKET = 'podcast-audio-474105';

async function grantPermissions() {
  console.log('\n🔐 Granting Cloud Storage Permissions...\n');
  console.log(`Service Account: ${serviceAccount}\n`);

  try {
    // Grant permissions to documents bucket
    console.log(`📦 Setting permissions for: ${DOCUMENTS_BUCKET}`);
    const documentsBucket = storage.bucket(DOCUMENTS_BUCKET);
    
    await documentsBucket.iam.setPolicy({
      bindings: [
        {
          role: 'roles/storage.objectAdmin',
          members: [`serviceAccount:${serviceAccount}`],
        },
        {
          role: 'roles/storage.legacyBucketReader',
          members: [`serviceAccount:${serviceAccount}`],
        },
      ],
    });
    console.log('✓ Permissions set for documents bucket\n');

    // Grant permissions to audio bucket
    console.log(`📦 Setting permissions for: ${AUDIO_BUCKET}`);
    const audioBucket = storage.bucket(AUDIO_BUCKET);
    
    await audioBucket.iam.setPolicy({
      bindings: [
        {
          role: 'roles/storage.objectAdmin',
          members: [`serviceAccount:${serviceAccount}`],
        },
        {
          role: 'roles/storage.legacyBucketReader',
          members: [`serviceAccount:${serviceAccount}`],
        },
      ],
    });
    console.log('✓ Permissions set for audio bucket\n');

    console.log('✅ All permissions granted successfully!\n');
    console.log('Next step: Run npm run test:gcs\n');
    
  } catch (error) {
    console.error('❌ Error granting permissions:', error.message);
    console.log('\n⚠️  Alternative: Grant permissions via Cloud Console:');
    console.log('1. Go to: https://console.cloud.google.com/storage/browser');
    console.log(`2. Click on "${DOCUMENTS_BUCKET}"`);
    console.log('3. Click "Permissions" tab');
    console.log('4. Click "Grant Access"');
    console.log(`5. Add principal: ${serviceAccount}`);
    console.log('6. Assign role: "Storage Object Admin"');
    console.log(`7. Repeat for "${AUDIO_BUCKET}"\n`);
    process.exit(1);
  }
}

grantPermissions();
