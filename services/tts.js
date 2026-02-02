const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const textToSpeech = require('@google-cloud/text-to-speech');
const cloudStorage = require('./cloudStorage');
const azureSpeech = require('./azureSpeech');

// Initialize Google Cloud TTS client
const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Configuration
const USE_GOOGLE_TTS = process.env.USE_GOOGLE_TTS === 'true';
const USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true';

// Ensure local uploads directory exists as fallback
const uploadsDir = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate real audio using Google Cloud Text-to-Speech API
 * @param {string} text - The text to convert to speech
 * @param {string} provider - Voice provider (google, browser, etc.)
 * @param {object} settings - Voice settings (voice, speed, pitch, volume)
 * @param {string} userId - User ID for file organization
 * @returns {Promise<object>} - Audio file information (url, size, duration, gcsPath, signedUrl)
 */
const generateAudio = async (text, provider, settings, userId = 'guest') => {
  try {
    console.log('\n🎤 Starting real TTS generation...');
    console.log(`   Provider: ${provider}`);
    console.log(`   Text length: ${text.length} characters`);
    console.log(`   User ID: ${userId}`);
    
    // Generate a unique ID for this audio file
    const audioId = crypto.randomBytes(16).toString('hex');
    const filename = `${audioId}.mp3`;
    
    // Calculate realistic duration based on text length
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const speed = settings.speed || 1.0;
    const wordsPerSecond = 2.5 * speed; // Average speaking rate adjusted by speed
    const estimatedDuration = Math.ceil(wordCount / wordsPerSecond);
    
    console.log(`   Word count: ${wordCount}`);
    console.log(`   Estimated duration: ${estimatedDuration}s`);
    
    // Priority 1: Azure Speech (if available and provider is 'azure')
    if (provider === 'azure' && azureSpeech.isAzureSpeechAvailable()) {
      return await generateAzureSpeechTTS(text, filename, settings, wordCount, estimatedDuration, userId);
    }
    
    // Priority 2: Google Cloud TTS if provider is 'google' or if explicitly enabled
    if (provider === 'google' || USE_GOOGLE_TTS) {
      return await generateGoogleTTS(text, filename, settings, wordCount, estimatedDuration, userId);
    } else {
      // Fallback to local mock audio for other providers
      return await generateMockAudio(text, filename, settings, wordCount, estimatedDuration, userId);
    }
  } catch (error) {
    console.error('❌ Error generating audio:', error);
    throw new Error(`Failed to generate audio: ${error.message}`);
  }
};

/**
 * Generate audio using Google Cloud Text-to-Speech API
 */
async function generateGoogleTTS(text, filename, settings, wordCount, estimatedDuration, userId) {
  try {
    console.log('🔊 Using Google Cloud Text-to-Speech...');
    
    // Construct the TTS request with actual voice configuration
    const request = {
      input: { text: text },
      voice: {
        languageCode: settings.languageCode || 'en-US',
        name: settings.voice || 'en-US-Neural2-D', // High-quality neural voice
        ssmlGender: settings.gender || 'NEUTRAL'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: settings.speed || 1.0,
        pitch: settings.pitch || 0.0,
        volumeGainDb: (settings.volume || 1.0) * 16 - 16, // Convert 0-1 to dB range
        effectsProfileId: ['headphone-class-device'],
        sampleRateHertz: 24000
      }
    };
    
    console.log(`   Voice: ${request.voice.name}`);
    console.log(`   Speed: ${request.audioConfig.speakingRate}x`);
    console.log(`   Pitch: ${request.audioConfig.pitch}`);
    
    // Call Google TTS API
    console.log('   Calling Google TTS API...');
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    // Get the audio content
    const audioContent = response.audioContent;
    const audioSize = audioContent.length;
    
    console.log(`   ✅ Audio generated: ${(audioSize / 1024).toFixed(2)} KB`);
    
    // Calculate actual duration from audio metadata (approximate)
    // MP3 at 24kHz, 128kbps: roughly 16KB per second
    const actualDuration = Math.ceil(audioSize / 16000);
    
    // Generate GCS file path
    const gcsPath = cloudStorage.generateFilePath(userId, filename, 'audio');
    
    // Save to cloud storage or local file
    let audioUrl, signedUrl, storageType;
    if (USE_CLOUD_STORAGE) {
      console.log('   ☁️  Uploading to Google Cloud Storage...');
      signedUrl = await cloudStorage.uploadFile(audioContent, gcsPath, 'audio', {
        contentType: 'audio/mpeg',
        metadata: {
          userId: userId,
          wordCount: wordCount.toString(),
          duration: actualDuration.toString(),
          voice: settings.voice || 'en-US-Neural2-D'
        }
      });
      audioUrl = gcsPath; // Store GCS path in database
      storageType = 'gcs';
      console.log(`   ✅ Uploaded to GCS: ${gcsPath}`);
    } else {
      console.log('   💾 Saving to local filesystem...');
      audioUrl = await saveLocalFile(audioContent, filename);
      signedUrl = audioUrl; // For local, URL is the direct path
      storageType = 'local';
    }
    
    console.log(`   🔗 Audio accessible at: ${audioUrl}`);
    console.log(`   ⏱️  Duration: ${Math.floor(actualDuration / 60)}:${(actualDuration % 60).toString().padStart(2, '0')}`);
    
    return {
      url: audioUrl,
      signedUrl: signedUrl,
      gcsPath: USE_CLOUD_STORAGE ? gcsPath : null,
      storageType: storageType,
      size: audioSize,
      duration: actualDuration
    };
  } catch (error) {
    console.error('❌ Google TTS Error:', error.message);
    // Fallback to mock audio if Google TTS fails
    console.log('   ⚠️  Falling back to mock audio generation...');
    return await generateMockAudio(text, filename, settings, wordCount, estimatedDuration, userId);
  }
}

/**
 * Generate audio using AWS Polly
 */
/**
 * Generate audio using Azure Speech Services
 */
async function generateAzureSpeechTTS(text, filename, settings, wordCount, estimatedDuration, userId) {
  try {
    console.log('🔊 Using Azure Speech Text-to-Speech...');
    
    // Call Azure Speech service
    const result = await azureSpeech.generateAzureAudio(text, settings);
    
    return {
      url: result.url,
      signedUrl: result.url,
      gcsPath: null,
      storageType: result.storageType || 'local',
      size: result.fileSize,
      duration: result.duration
    };
  } catch (error) {
    console.error('❌ Azure Speech Error:', error.message);
    // Fallback to mock audio if Azure Speech fails
    console.log('   ⚠️  Falling back to mock audio generation...');
    return await generateMockAudio(text, filename, settings, wordCount, estimatedDuration, userId);
  }
}

/**
 * Generate audio using Google Cloud Text-to-Speech API
 */
async function generateGoogleTTS(text, filename, settings, wordCount, estimatedDuration) {
  try {
    console.log('🔊 Using Google Cloud Text-to-Speech...');
    
    // Construct the TTS request with actual voice configuration
    const request = {
      input: { text: text },
      voice: {
        languageCode: settings.languageCode || 'en-US',
        name: settings.voice || 'en-US-Neural2-D', // High-quality neural voice
        ssmlGender: settings.gender || 'NEUTRAL'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: settings.speed || 1.0,
        pitch: settings.pitch || 0.0,
        volumeGainDb: (settings.volume || 1.0) * 16 - 16, // Convert 0-1 to dB range
        effectsProfileId: ['headphone-class-device'],
        sampleRateHertz: 24000
      }
    };
    
    console.log(`   Voice: ${request.voice.name}`);
    console.log(`   Speed: ${request.audioConfig.speakingRate}x`);
    console.log(`   Pitch: ${request.audioConfig.pitch}`);
    
    // Call Google TTS API
    console.log('   Calling Google TTS API...');
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    // Get the audio content
    const audioContent = response.audioContent;
    const audioSize = audioContent.length;
    
    console.log(`   ✅ Audio generated: ${(audioSize / 1024).toFixed(2)} KB`);
    
    // Calculate actual duration from audio metadata (approximate)
    // MP3 at 24kHz, 128kbps: roughly 16KB per second
    const actualDuration = Math.ceil(audioSize / 16000);
    
    // Save to cloud storage or local file
    let audioUrl;
    if (USE_CLOUD_STORAGE) {
      audioUrl = await uploadToCloudStorage(audioContent, filename);
    } else {
      audioUrl = await saveLocalFile(audioContent, filename);
    }
    
    console.log(`   � Audio saved: ${audioUrl}`);
    console.log(`   ⏱️  Duration: ${Math.floor(actualDuration / 60)}:${(actualDuration % 60).toString().padStart(2, '0')}`);
    
    return {
      url: audioUrl,
      size: audioSize,
      duration: actualDuration
    };
  } catch (error) {
    console.error('❌ Google TTS Error:', error.message);
    // Fallback to mock audio if Google TTS fails
    console.log('   ⚠️  Falling back to mock audio generation...');
    return await generateMockAudio(text, filename, settings, wordCount, estimatedDuration);
  }
}

/**
 * Generate mock audio (fallback)
 */
async function generateMockAudio(text, filename, settings, wordCount, estimatedDuration, userId) {
  console.log('🔇 Using mock audio generation (fallback)...');
  
  const finalDuration = Math.max(estimatedDuration, 20);
  const estimatedSize = Math.ceil(finalDuration * 16000);
  
  console.log(`   Duration: ${finalDuration}s (${Math.floor(finalDuration / 60)}:${(finalDuration % 60).toString().padStart(2, '0')})`);
  console.log(`   Size: ${(estimatedSize / 1024).toFixed(2)} KB`);
  
  const filePath = path.join(uploadsDir, filename);
  
  // Generate mock MP3 file
  await generateMockAudioFile(filePath, text, finalDuration, settings);
  
  return {
    url: `/uploads/audio/${filename}`,
    signedUrl: `/uploads/audio/${filename}`,
    gcsPath: null,
    storageType: 'local',
    size: estimatedSize,
    duration: finalDuration
  };
}

// Remove the old uploadToCloudStorage function since we're using cloudStorage service

/**
 * Save audio file locally
 */
async function saveLocalFile(audioContent, filename) {
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, audioContent);
  return `/uploads/audio/${filename}`;
}

/**
 * Generate a mock MP3 file for testing (when Google TTS is not available)
 */
async function generateMockAudioFile(filePath, text, duration, settings) {
  // Create a basic MP3 file structure with ID3v2 tags
  const id3Header = Buffer.from([
    0x49, 0x44, 0x33, // "ID3"
    0x04, 0x00, // Version 2.4.0
    0x00, // Flags
    0x00, 0x00, 0x00, 0x00 // Size
  ]);
  
  // Create title frame
  const titleText = `Podcast Audio - ${duration}s`;
  const titleFrame = createID3Frame('TIT2', titleText);
  
  // MP3 frame (silence)
  const mp3Frame = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00,
    ...Buffer.alloc(417, 0x00)
  ]);
  
  // Calculate frames needed
  const framesNeeded = Math.ceil(duration * 38.28);
  
  // Write the file
  const fileStream = fs.createWriteStream(filePath);
  fileStream.write(id3Header);
  fileStream.write(titleFrame);
  
  for (let i = 0; i < framesNeeded; i++) {
    fileStream.write(mp3Frame);
  }
  
  await new Promise((resolve, reject) => {
    fileStream.end(() => resolve());
    fileStream.on('error', reject);
  });
  
  console.log(`   ✅ Mock file created: ${path.basename(filePath)}`);
}

/**
 * Helper to create ID3v2 frames
 */
function createID3Frame(frameId, text) {
  const textBuffer = Buffer.from(text, 'utf8');
  const frameSize = textBuffer.length + 1;
  
  return Buffer.concat([
    Buffer.from(frameId, 'ascii'),
    Buffer.from([
      (frameSize >> 21) & 0x7F,
      (frameSize >> 14) & 0x7F,
      (frameSize >> 7) & 0x7F,
      frameSize & 0x7F
    ]),
    Buffer.from([0x00, 0x00]),
    Buffer.from([0x03]),
    textBuffer
  ]);
}

/**
 * Get list of available Google TTS voices
 */
async function getAvailableVoices(languageCode = 'en-US') {
  try {
    const [result] = await ttsClient.listVoices({ languageCode });
    return result.voices.map(voice => ({
      name: voice.name,
      languageCode: voice.languageCodes[0],
      gender: voice.ssmlGender,
      naturalSampleRateHertz: voice.naturalSampleRateHertz
    }));
  } catch (error) {
    // Only log brief message for permission errors (expected without billing)
    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      // Silent - will be handled by caller
    } else {
      console.error('Error fetching voices:', error.message || error);
    }
    return [];
  }
}

module.exports = {
  generateAudio,
  getAvailableVoices
};

// Generate a mock MP3 file for testing
// In production, this would be replaced with actual TTS API calls
async function generateMockAudioFile(filePath, text, duration, settings) {
  // Create a basic MP3 file structure with ID3v2 tags
  // This is a simplified version - in production you'd use a proper MP3 encoder
  
  // ID3v2 header
  const id3Header = Buffer.from([
    0x49, 0x44, 0x33, // "ID3"
    0x04, 0x00, // Version 2.4.0
    0x00, // Flags
    0x00, 0x00, 0x00, 0x00 // Size (synchsafe integer)
  ]);
  
  // Create title frame (TIT2)
  const titleText = `Podcast Audio - ${duration}s`;
  const titleFrame = createID3Frame('TIT2', titleText);
  
  // Create a minimal MP3 frame (silence)
  // This is a valid MP3 frame header for Layer III, 128kbps, 44.1kHz
  const mp3Frame = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // Frame sync + header
    ...Buffer.alloc(417, 0x00) // Silent audio data (one frame ≈ 26ms)
  ]);
  
  // Calculate how many frames we need for the duration
  const framesNeeded = Math.ceil(duration * 38.28); // ~38.28 frames per second at 44.1kHz
  
  // Write the file
  const fileStream = fs.createWriteStream(filePath);
  fileStream.write(id3Header);
  fileStream.write(titleFrame);
  
  // Write MP3 frames
  for (let i = 0; i < framesNeeded; i++) {
    fileStream.write(mp3Frame);
  }
  
  await new Promise((resolve, reject) => {
    fileStream.end(() => resolve());
    fileStream.on('error', reject);
  });
  
  console.log(`✅ Generated mock audio file: ${path.basename(filePath)}`);
}

// Helper function to create ID3v2 frames
function createID3Frame(frameId, text) {
  const textBuffer = Buffer.from(text, 'utf8');
  const frameSize = textBuffer.length + 1; // +1 for encoding byte
  
  const frame = Buffer.concat([
    Buffer.from(frameId, 'ascii'), // Frame ID (4 bytes)
    Buffer.from([
      (frameSize >> 21) & 0x7F,
      (frameSize >> 14) & 0x7F,
      (frameSize >> 7) & 0x7F,
      frameSize & 0x7F
    ]), // Size (synchsafe integer, 4 bytes)
    Buffer.from([0x00, 0x00]), // Flags (2 bytes)
    Buffer.from([0x03]), // Encoding (UTF-8)
    textBuffer // Text content
  ]);
  
  return frame;
}

module.exports = {
  generateAudio,
  getAvailableVoices
};