const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class ElevenLabsService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.baseURL = 'https://api.elevenlabs.io/v1';
        
        // Check if API key is a placeholder or missing
        if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE' || this.apiKey.length < 10) {
            console.warn('⚠️  ELEVENLABS_API_KEY not configured properly. Voice cloning features disabled.');
            console.warn('⚠️  Get your API key from: https://elevenlabs.io/app/settings/api-keys');
            this.apiKey = null; // Set to null to ensure checks work properly
        }
    }

    /**
     * Get all available voices
     */
    async getVoices() {
        if (!this.apiKey) {
            console.warn('⚠️  ElevenLabs API key not configured');
            return [];
        }

        try {
            const response = await axios.get(`${this.baseURL}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            return response.data.voices;
        } catch (error) {
            console.error('Error fetching voices:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Clone a voice from audio samples
     * @param {string} name - Name for the cloned voice
     * @param {Array} audioFiles - Array of audio file paths (min 1, max 25)
     * @param {string} description - Optional description
     */
    async cloneVoice(name, audioFiles, description = '') {
        if (!this.apiKey) {
            throw new Error('ElevenLabs API key not configured. Please sign up at https://elevenlabs.io and add your API key to ELEVENLABS_API_KEY environment variable.');
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            
            if (description) {
                formData.append('description', description);
            }

            console.log(`📁 Adding ${audioFiles.length} audio files to FormData...`);
            // Add audio files
            for (const filePath of audioFiles) {
                formData.append('files', fs.createReadStream(filePath));
            }

            console.log('🌐 Sending request to ElevenLabs API...');
            const response = await axios.post(
                `${this.baseURL}/voices/add`,
                formData,
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        ...formData.getHeaders()
                    },
                    timeout: 120000, // 2 minute timeout
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            console.log('✅ ElevenLabs API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ ElevenLabs API Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            
            // Provide more detailed error messages
            if (error.response?.status === 401) {
                throw new Error('Invalid ElevenLabs API key. Please check your ELEVENLABS_API_KEY.');
            } else if (error.response?.status === 429) {
                throw new Error('ElevenLabs API rate limit exceeded. Please try again later.');
            } else if (error.response?.data?.detail) {
                throw new Error(error.response.data.detail.message || JSON.stringify(error.response.data.detail));
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout - ElevenLabs API took too long to respond.');
            }
            
            throw new Error(error.response?.data?.message || error.message || 'Failed to clone voice');
        }
    }

    /**
     * Generate speech from text using a voice
     * @param {string} text - Text to convert to speech
     * @param {string} voiceId - Voice ID to use
     * @param {string} outputPath - Path to save audio file
     */
    async textToSpeech(text, voiceId, outputPath) {
        if (!this.apiKey) {
            throw new Error('ElevenLabs API key not configured');
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/text-to-speech/${voiceId}`,
                {
                    text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                },
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );

            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(outputPath));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Error generating speech:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Delete a cloned voice
     * @param {string} voiceId - Voice ID to delete
     */
    async deleteVoice(voiceId) {
        if (!this.apiKey) {
            throw new Error('ElevenLabs API key not configured');
        }

        try {
            await axios.delete(`${this.baseURL}/voices/${voiceId}`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            return { success: true };
        } catch (error) {
            console.error('Error deleting voice:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get voice details
     * @param {string} voiceId - Voice ID
     */
    async getVoiceDetails(voiceId) {
        if (!this.apiKey) {
            throw new Error('ElevenLabs API key not configured');
        }

        try {
            const response = await axios.get(`${this.baseURL}/voices/${voiceId}`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching voice details:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new ElevenLabsService();
