/**
 * Browser-based Text-to-Speech Service
 * Uses Web Speech API - FREE, no API keys needed
 * Generates audio in the browser without server costs
 */

/**
 * Get available browser voices
 * This will be called from the frontend
 */
function getBrowserVoicesList() {
  // This function is for reference - actual voices are retrieved in browser
  return {
    supported: true,
    note: 'Browser TTS uses the Web Speech API which is built into all modern browsers',
    features: [
      'Free - no API costs',
      'Multiple voices (depends on OS)',
      'Adjustable speed and pitch',
      'Real-time synthesis',
      'No internet required after page load'
    ],
    browsers: {
      chrome: 'Excellent support, 20+ voices',
      edge: 'Excellent support, 20+ voices',
      safari: 'Good support, 10+ voices',
      firefox: 'Basic support, system voices'
    }
  };
}

/**
 * Browser TTS Configuration
 */
const browserTTSConfig = {
  enabled: true,
  defaultLanguage: 'en-US',
  defaultRate: 1.0,
  defaultPitch: 1.0,
  defaultVolume: 1.0,
  chunkSize: 1000, // Characters per chunk
  pauseBetweenChunks: 100 // Milliseconds
};

module.exports = {
  getBrowserVoicesList,
  browserTTSConfig
};
