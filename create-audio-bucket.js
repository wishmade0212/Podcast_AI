/**
 * Create missing audio bucket for Google Cloud Storage
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, 'google-credentials.json')
});

const PROJECT_ID = 'podcast-generator-474105';
const AUDIO_BUCKET = 'podcast-audio-474105';
const LOCATION = 'us-central1';

async function createAudioBucket() {
  console.log('\n📦 Creating Audio Bucket...\n');

  try {
    // Check if bucket already exists
    const [exists] = await storage.bucket(AUDIO_BUCKET).exists();
    
    if (exists) {
      console.log(`✓ Bucket already exists: ${AUDIO_BUCKET}`);
      console.log('\n✅ Audio bucket is ready!\n');
      return;
    }

    // Create the bucket
    console.log(`Creating bucket: ${AUDIO_BUCKET}`);
    console.log(`Location: ${LOCATION}`);
    console.log(`Project: ${PROJECT_ID}\n`);

    const [bucket] = await storage.createBucket(AUDIO_BUCKET, {
      location: LOCATION,
      storageClass: 'STANDARD',
      uniformBucketLevelAccess: {
        enabled: true,
      },
    });

    console.log(`✓ Bucket created: ${bucket.name}`);
    console.log(`✓ Location: ${LOCATION}`);
    console.log(`✓ Storage class: STANDARD\n`);

    console.log('✅ Audio bucket created successfully!\n');
    console.log('Next step: Run npm run test:gcs\n');

  } catch (error) {
    console.error('❌ Error creating bucket:', error.message);
    
    if (error.code === 409) {
      console.log('\n⚠️  Bucket already exists but may be in a different project.');
      console.log('Try using a unique name like: podcast-audio-474105-yourname\n');
    } else if (error.code === 403) {
      console.log('\n⚠️  Permission denied. Make sure:');
      console.log('1. Billing is enabled for your project');
      console.log('2. Cloud Storage API is enabled');
      console.log('3. Service account has Storage Admin role\n');
    }
    
    process.exit(1);
  }
}

createAudioBucket();
