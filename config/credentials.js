// Railway Credentials Handler
// This script writes google-credentials.json from environment variable if it exists

const fs = require('fs');
const path = require('path');

function setupGoogleCredentials() {
  // If running on Railway or other cloud platform
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      const credentialsPath = path.join(__dirname, 'google-credentials.json');
      
      // Write credentials from environment variable
      fs.writeFileSync(credentialsPath, process.env.GOOGLE_CREDENTIALS);
      
      console.log('✅ Google credentials loaded from environment variable');
      
      // Set the path for Google Cloud libraries
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    } catch (error) {
      console.error('❌ Error setting up Google credentials:', error.message);
      console.log('⚠️  App will use fallback services (Browser TTS, local storage)');
    }
  } else if (fs.existsSync(path.join(__dirname, 'google-credentials.json'))) {
    // Local development - credentials file exists
    console.log('✅ Using local google-credentials.json');
  } else {
    // No credentials available - use fallback services
    console.log('ℹ️  No Google credentials found - using fallback services');
    console.log('   - Browser TTS for audio generation');
    console.log('   - Local storage for files');
  }
}

module.exports = { setupGoogleCredentials };
