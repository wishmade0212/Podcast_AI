/**
 * Browser Text-to-Speech Manager
 * Uses Web Speech API for FREE audio generation
 * No API keys, no server costs, no billing required!
 */

class BrowserTTSManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.currentUtterance = null;
    this.isInitialized = false;
    this.audioChunks = [];
    
    // Check if browser supports TTS
    if (!this.synthesis) {
      console.warn('⚠️  Browser does not support Text-to-Speech');
      return;
    }
    
    this.initializeVoices();
  }
  
  /**
   * Initialize and load available voices
   */
  initializeVoices() {
    // Load voices
    const loadVoices = () => {
      this.voices = this.synthesis.getVoices();
      
      if (this.voices.length > 0) {
        this.isInitialized = true;
        console.log(`✅ Browser TTS: Loaded ${this.voices.length} voices`);
        console.log('Available voices:', this.voices.map(v => `${v.name} (${v.lang})`));
      }
    };
    
    // Load immediately
    loadVoices();
    
    // Some browsers load voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
    
    // Fallback: try again after a delay
    setTimeout(loadVoices, 100);
  }
  
  /**
   * Get all available voices
   */
  getVoices() {
    return this.voices.map(voice => ({
      id: voice.name,
      name: voice.name,
      language: voice.lang,
      default: voice.default,
      localService: voice.localService,
      voiceURI: voice.voiceURI
    }));
  }
  
  /**
   * Get voices filtered by language
   */
  getVoicesByLanguage(languageCode = 'en-US') {
    return this.voices.filter(voice => 
      voice.lang.startsWith(languageCode.split('-')[0])
    );
  }
  
  /**
   * Find a specific voice by name
   */
  findVoice(voiceName) {
    return this.voices.find(voice => 
      voice.name === voiceName || voice.voiceURI === voiceName
    );
  }
  
  /**
   * Get the best default voice for a language
   */
  getDefaultVoice(languageCode = 'en-US') {
    // Try to find a natural/neural voice first
    let voice = this.voices.find(v => 
      v.lang.startsWith(languageCode.split('-')[0]) && 
      (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium'))
    );
    
    // Fall back to any voice with the right language
    if (!voice) {
      voice = this.voices.find(v => v.lang.startsWith(languageCode.split('-')[0]));
    }
    
    // Last resort: any default voice
    if (!voice) {
      voice = this.voices.find(v => v.default);
    }
    
    return voice || this.voices[0];
  }
  
  /**
   * Speak text using browser TTS
   * Returns a promise that resolves when speaking is complete
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || this.voices.length === 0) {
        reject(new Error('Browser TTS not initialized'));
        return;
      }
      
      // Cancel any ongoing speech
      this.stop();
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      if (options.voice) {
        const voice = this.findVoice(options.voice) || this.getDefaultVoice(options.language);
        utterance.voice = voice;
      } else {
        utterance.voice = this.getDefaultVoice(options.language);
      }
      
      // Set parameters
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      utterance.lang = options.language || 'en-US';
      
      // Event handlers
      utterance.onstart = () => {
        console.log('🔊 Browser TTS: Started speaking');
        if (options.onStart) options.onStart();
      };
      
      utterance.onend = () => {
        console.log('✅ Browser TTS: Finished speaking');
        if (options.onEnd) options.onEnd();
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Browser TTS Error:', event.error);
        if (options.onError) options.onError(event.error);
        reject(new Error(event.error));
      };
      
      utterance.onpause = () => {
        if (options.onPause) options.onPause();
      };
      
      utterance.onresume = () => {
        if (options.onResume) options.onResume();
      };
      
      // Store current utterance
      this.currentUtterance = utterance;
      
      // Speak!
      this.synthesis.speak(utterance);
    });
  }
  
  /**
   * Stop current speech
   */
  stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }
  
  /**
   * Pause current speech
   */
  pause() {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }
  
  /**
   * Resume paused speech
   */
  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }
  
  /**
   * Check if currently speaking
   */
  isSpeaking() {
    return this.synthesis.speaking;
  }
  
  /**
   * Check if paused
   */
  isPaused() {
    return this.synthesis.paused;
  }
  
  /**
   * Generate audio from text (for podcast creation)
   * This will generate audio but note: Web Speech API doesn't allow
   * direct audio file export in most browsers
   */
  async generateAudioForPodcast(text, options = {}) {
    console.log('🎙️  Generating podcast audio with Browser TTS...');
    console.log('   Note: This will speak the text. For downloadable audio, server-side TTS is needed.');
    
    // Speak the text
    await this.speak(text, options);
    
    return {
      success: true,
      method: 'browser-tts',
      note: 'Audio was spoken in browser. To save as file, server-side TTS is required.',
      text: text,
      voice: options.voice,
      duration: Math.ceil(text.length / 15) // Rough estimate: ~15 chars per second
    };
  }
}

// Create global instance
window.browserTTS = new BrowserTTSManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserTTSManager;
}
