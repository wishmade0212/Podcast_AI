let sdk = null;

try {
    sdk = require('microsoft-cognitiveservices-speech-sdk');
} catch (error) {
    console.warn('⚠️  Azure Speech SDK not installed. Azure TTS will not be available.');
}

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const gridfs = require('./gridfs');

// Azure Speech configuration from environment variables
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';

/**
 * Check if Azure Speech is available
 */
function isAzureSpeechAvailable() {
    if (!sdk) {
        console.log('⚠️  Azure Speech SDK not installed');
        return false;
    }
    
    const available = !!(AZURE_SPEECH_KEY && AZURE_SPEECH_REGION);
    
    if (available) {
        console.log('✅ Azure Speech configured successfully');
        console.log('   Region:', AZURE_SPEECH_REGION);
    } else {
        console.log('⚠️  Azure Speech not configured');
        console.log('   Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables');
    }
    
    return available;
}

/**
 * Generate audio using Azure Speech Services
 * @param {string} text - Text to convert to speech
 * @param {Object} settings - Voice settings (voice, rate, pitch, etc.)
 * @returns {Promise<Object>} Audio file information
 */
async function generateAzureAudio(text, settings = {}) {
    if (!sdk) {
        throw new Error('Azure Speech SDK not installed');
    }
    
    if (!isAzureSpeechAvailable()) {
        throw new Error('Azure Speech credentials not configured');
    }

    try {
        console.log('🔊 Using Azure Speech Text-to-Speech...');
        console.log('   Voice:', settings.voice || 'en-US-JennyNeural');
        console.log('   Text length:', text.length, 'characters');

        // Create speech config
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            AZURE_SPEECH_KEY,
            AZURE_SPEECH_REGION
        );

        // Set output format to high-quality audio
        speechConfig.speechSynthesisOutputFormat = 
            sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

        // Set voice
        const voiceName = settings.voice || 'en-US-JennyNeural';
        speechConfig.speechSynthesisVoiceName = voiceName;

        // Create unique filename
        const filename = `azure_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
        
        // Use system temp directory for temporary file
        const tempDir = os.tmpdir();
        const filepath = path.join(tempDir, filename);

        // Create audio config for file output
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filepath);

        // Create synthesizer
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        // Prepare SSML with speed control
        const rate = settings.rate || 1.0;
        const ratePercent = Math.round((rate - 1.0) * 100);
        const rateString = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

        const ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                <voice name="${voiceName}">
                    <prosody rate="${rateString}">
                        ${escapeXml(text)}
                    </prosody>
                </voice>
            </speak>
        `;

        // Synthesize speech
        const result = await new Promise((resolve, reject) => {
            synthesizer.speakSsmlAsync(
                ssml,
                result => {
                    synthesizer.close();
                    resolve(result);
                },
                error => {
                    synthesizer.close();
                    reject(error);
                }
            );
        });

        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Get file stats
            const stats = await fs.stat(filepath);
            const fileSizeKB = (stats.size / 1024).toFixed(2);

            // Estimate duration (MP3 at 48kbps)
            const durationSeconds = Math.round((stats.size * 8) / 48000);
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            console.log('✅ Audio generated:', fileSizeKB, 'KB');
            console.log('⏱️  Duration:', duration);
            
            // Upload to GridFS
            console.log('☁️  Uploading audio to GridFS...');
            const uploadResult = await gridfs.uploadFileToGridFS(
                filepath,
                filename,
                {
                    contentType: 'audio/mpeg',
                    provider: 'azure',
                    voiceName: voiceName,
                    duration: duration,
                    fileSize: stats.size
                }
            );
            
            // Delete temporary file
            try {
                await fs.unlink(filepath);
                console.log('🗑️  Temporary file deleted');
            } catch (unlinkError) {
                console.warn('⚠️  Could not delete temp file:', unlinkError.message);
            }
            
            const gridfsId = uploadResult.fileId.toString();
            console.log('💾 Audio saved to GridFS:', gridfsId);

            return {
                success: true,
                filepath: gridfsId,
                filename: filename,
                url: `/api/documents/file/${gridfsId}`,
                fileSize: stats.size,
                duration: duration,
                provider: 'azure',
                storageType: 'gridfs',
                gridfsId: gridfsId
            };
        } else {
            throw new Error(`Speech synthesis failed: ${result.errorDetails}`);
        }

    } catch (error) {
        console.error('❌ Azure Speech Error:', error.message);
        throw error;
    }
}

/**
 * Get available voices from Azure Speech
 * @param {string} languageCode - Optional language filter (e.g., 'en-US')
 * @returns {Promise<Array>} List of available voices
 */
async function getAzureVoices(languageCode = null) {
    if (!isAzureSpeechAvailable()) {
        console.log('⚠️  Azure Speech not configured, using default voices');
        return getRecommendedVoices();
    }

    try {
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            AZURE_SPEECH_KEY,
            AZURE_SPEECH_REGION
        );

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

        const result = await new Promise((resolve, reject) => {
            synthesizer.getVoicesAsync(
                languageCode || '',
                result => {
                    synthesizer.close();
                    resolve(result);
                },
                error => {
                    synthesizer.close();
                    reject(error);
                }
            );
        });

        if (result.reason === sdk.ResultReason.VoicesListRetrieved) {
            const voices = result.voices.map(voice => ({
                id: voice.shortName,
                name: voice.localName,
                languageCode: voice.locale,
                gender: voice.gender === 1 ? 'Male' : voice.gender === 2 ? 'Female' : 'Neutral',
                isNeural: voice.voiceType === 'Neural',
                locale: voice.locale
            }));

            console.log(`✅ Retrieved ${voices.length} Azure voices`);
            return voices;
        } else {
            console.log('⚠️  Failed to retrieve voices, using defaults');
            return getRecommendedVoices();
        }

    } catch (error) {
        console.error('❌ Error fetching Azure voices:', error.message);
        return getRecommendedVoices();
    }
}

/**
 * Get recommended neural voices for podcasts
 * @returns {Array} List of recommended voices
 */
function getRecommendedVoices() {
    return [
        {
            id: 'en-US-JennyNeural',
            name: 'Jenny (US Female)',
            languageCode: 'en-US',
            gender: 'Female',
            isNeural: true,
            description: 'Warm, natural voice - Best for podcasts'
        },
        {
            id: 'en-US-GuyNeural',
            name: 'Guy (US Male)',
            languageCode: 'en-US',
            gender: 'Male',
            isNeural: true,
            description: 'Clear, professional voice'
        },
        {
            id: 'en-US-AriaNeural',
            name: 'Aria (US Female)',
            languageCode: 'en-US',
            gender: 'Female',
            isNeural: true,
            description: 'Expressive, engaging voice'
        },
        {
            id: 'en-US-DavisNeural',
            name: 'Davis (US Male)',
            languageCode: 'en-US',
            gender: 'Male',
            isNeural: true,
            description: 'Conversational, friendly voice'
        },
        {
            id: 'en-GB-SoniaNeural',
            name: 'Sonia (UK Female)',
            languageCode: 'en-GB',
            gender: 'Female',
            isNeural: true,
            description: 'British accent, elegant'
        },
        {
            id: 'en-GB-RyanNeural',
            name: 'Ryan (UK Male)',
            languageCode: 'en-GB',
            gender: 'Male',
            isNeural: true,
            description: 'British accent, authoritative'
        },
        {
            id: 'en-AU-NatashaNeural',
            name: 'Natasha (Australian Female)',
            languageCode: 'en-AU',
            gender: 'Female',
            isNeural: true,
            description: 'Australian accent, clear'
        },
        {
            id: 'en-AU-WilliamNeural',
            name: 'William (Australian Male)',
            languageCode: 'en-AU',
            gender: 'Male',
            isNeural: true,
            description: 'Australian accent, professional'
        }
    ];
}

/**
 * Escape XML special characters for SSML
 */
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = {
    isAzureSpeechAvailable,
    generateAzureAudio,
    getAzureVoices,
    getRecommendedVoices
};
