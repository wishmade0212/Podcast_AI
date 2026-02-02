const { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } = require('@aws-sdk/client-polly');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Initialize AWS Polly client
let pollyClient = null;

// Check if AWS credentials are configured
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  pollyClient = new PollyClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log('✅ AWS Polly configured successfully');
  console.log(`   Region: ${AWS_REGION}`);
} else {
  console.log('ℹ️  AWS Polly not configured (credentials missing)');
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Check if AWS Polly is available
 */
function isPollyAvailable() {
  return pollyClient !== null;
}

/**
 * Generate audio using AWS Polly
 * @param {string} text - Text to convert to speech
 * @param {object} settings - Voice settings
 * @returns {Promise<object>} - Audio file information
 */
async function generatePollyAudio(text, settings = {}) {
  if (!pollyClient) {
    throw new Error('AWS Polly is not configured. Please set AWS credentials.');
  }

  try {
    console.log('\n🎤 Starting AWS Polly TTS generation...');
    console.log(`   Text length: ${text.length} characters`);
    console.log(`   Voice: ${settings.voice || 'Joanna'}`);
    
    // Generate unique filename
    const audioId = crypto.randomBytes(16).toString('hex');
    const filename = `${audioId}.mp3`;
    const filePath = path.join(uploadsDir, filename);
    
    // Map voice settings to Polly parameters
    const voiceId = settings.voice || 'Joanna'; // Default to Joanna (female, US English)
    const engine = settings.engine || 'neural'; // Use neural engine for better quality
    
    // Prepare Polly parameters
    const params = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: engine,
      SampleRate: '24000',
      TextType: 'text',
    };
    
    // Add optional prosody settings if provided
    if (settings.speed && settings.speed !== 1.0) {
      // Convert speed multiplier to SSML rate percentage
      const ratePercent = Math.round(settings.speed * 100);
      params.Text = `<speak><prosody rate="${ratePercent}%">${text}</prosody></speak>`;
      params.TextType = 'ssml';
    }
    
    console.log(`   Engine: ${engine}`);
    console.log(`   Sample Rate: 24kHz`);
    
    // Call AWS Polly API
    const command = new SynthesizeSpeechCommand(params);
    const response = await pollyClient.send(command);
    
    // Get audio stream
    const audioStream = response.AudioStream;
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    
    // Save to file
    await fs.promises.writeFile(filePath, audioBuffer);
    
    const audioSize = audioBuffer.length;
    console.log(`   ✅ Audio generated: ${(audioSize / 1024).toFixed(2)} KB`);
    
    // Calculate duration (approximate)
    // MP3 at 24kHz, 128kbps: roughly 16KB per second
    const duration = Math.ceil(audioSize / 16000);
    
    console.log(`   ⏱️  Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
    console.log(`   💾 Saved to: ${filename}`);
    
    return {
      url: `/uploads/audio/${filename}`,
      size: audioSize,
      duration: duration,
      storageType: 'local',
      engine: engine,
      voiceId: voiceId,
    };
  } catch (error) {
    console.error('❌ AWS Polly Error:', error.message);
    throw new Error(`AWS Polly TTS failed: ${error.message}`);
  }
}

/**
 * Get available AWS Polly voices
 * @param {string} languageCode - Optional language code filter (e.g., 'en-US')
 * @returns {Promise<Array>} - List of available voices
 */
async function getPollyVoices(languageCode = null) {
  if (!pollyClient) {
    return [];
  }

  try {
    const params = {};
    if (languageCode) {
      params.LanguageCode = languageCode;
    }

    const command = new DescribeVoicesCommand(params);
    const response = await pollyClient.send(command);
    
    return response.Voices.map(voice => ({
      id: voice.Id,
      name: voice.Name,
      gender: voice.Gender,
      languageCode: voice.LanguageCode,
      languageName: voice.LanguageName,
      supportedEngines: voice.SupportedEngines,
    }));
  } catch (error) {
    console.error('Error fetching Polly voices:', error.message);
    return [];
  }
}

/**
 * Get popular/recommended voices for quick selection
 */
function getRecommendedVoices() {
  return [
    { id: 'Joanna', name: 'Joanna', gender: 'Female', language: 'US English', description: 'Natural, professional' },
    { id: 'Matthew', name: 'Matthew', gender: 'Male', language: 'US English', description: 'Clear, authoritative' },
    { id: 'Amy', name: 'Amy', gender: 'Female', language: 'British English', description: 'Elegant, refined' },
    { id: 'Brian', name: 'Brian', gender: 'Male', language: 'British English', description: 'Professional, clear' },
    { id: 'Ruth', name: 'Ruth', gender: 'Female', language: 'US English', description: 'Warm, friendly (Neural)' },
    { id: 'Stephen', name: 'Stephen', gender: 'Male', language: 'US English', description: 'Conversational (Neural)' },
    { id: 'Aria', name: 'Aria', gender: 'Female', language: 'New Zealand English', description: 'Natural (Neural)' },
    { id: 'Ayanda', name: 'Ayanda', gender: 'Female', language: 'South African English', description: 'Expressive (Neural)' },
  ];
}

module.exports = {
  isPollyAvailable,
  generatePollyAudio,
  getPollyVoices,
  getRecommendedVoices,
};
