const mongoose = require('mongoose');

const customVoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Also keep 'user' for backwards compatibility
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Voice ID from external service (ElevenLabs, etc.)
  voiceId: {
    type: String,
    required: true
  },
  // Provider information
  provider: {
    type: String,
    enum: ['elevenlabs', 'playht', 'rvc', 'custom'],
    required: true,
    default: 'elevenlabs'
  },
  // Sample files used for cloning
  sampleFiles: [{
    type: String
  }],
  // Audio file stored in GridFS (optional, for RVC)
  audioFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'uploads.files'
  },
  audioFileName: {
    type: String
  },
  audioFileSize: {
    type: Number
  },
  // Audio metadata
  duration: {
    type: Number // Duration in seconds
  },
  format: {
    type: String,
    enum: ['mp3', 'wav', 'ogg', 'm4a']
  },
  sampleRate: {
    type: Number,
    default: 44100
  },
  // Voice processing status
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'failed'],
    default: 'ready'
  },
  processingError: {
    type: String
  },
  // Voice clone metadata
  voiceModelId: {
    type: String // Alias for voiceId
  },
  voiceProvider: {
    type: String, // Alias for provider
    enum: ['elevenlabs', 'playht', 'rvc', 'custom', null]
  },
  modelPath: {
    type: String // Path to trained RVC model file
  },
  // Voice characteristics
  gender: {
    type: String,
    enum: ['male', 'female', 'neutral', 'unknown'],
    default: 'unknown'
  },
  language: {
    type: String,
    default: 'en-US'
  },
  accent: {
    type: String
  },
  // Usage statistics
  timesUsed: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date
  },
  // Metadata
  isDefault: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
customVoiceSchema.index({ user: 1, createdAt: -1 });
customVoiceSchema.index({ status: 1 });
customVoiceSchema.index({ user: 1, name: 1 });

// Virtual for audio URL
customVoiceSchema.virtual('audioUrl').get(function() {
  return `/api/custom-voices/${this._id}/audio`;
});

// Ensure virtuals are included in JSON
customVoiceSchema.set('toJSON', { virtuals: true });
customVoiceSchema.set('toObject', { virtuals: true });

// Pre-remove hook to clean up audio file from GridFS
customVoiceSchema.pre('remove', async function(next) {
  try {
    const mongoose = require('mongoose');
    const conn = mongoose.connection;
    const GridFSBucket = mongoose.mongo.GridFSBucket;
    const bucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
    
    // Delete the audio file from GridFS
    await bucket.delete(this.audioFileId);
    console.log(`🗑️  Deleted audio file ${this.audioFileId} for voice ${this.name}`);
  } catch (error) {
    console.error('Error deleting audio file:', error);
  }
  next();
});

// Instance methods
customVoiceSchema.methods.incrementUsage = async function() {
  this.timesUsed += 1;
  this.lastUsedAt = new Date();
  await this.save();
};

customVoiceSchema.methods.updateStatus = async function(status, error = null) {
  this.status = status;
  if (error) {
    this.processingError = error;
  }
  await this.save();
};

// Static methods
customVoiceSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

customVoiceSchema.statics.findReadyVoices = function(userId) {
  return this.find({ user: userId, status: 'ready' }).sort({ createdAt: -1 });
};

customVoiceSchema.statics.getDefaultVoice = function(userId) {
  return this.findOne({ user: userId, isDefault: true, status: 'ready' });
};

const CustomVoice = mongoose.model('CustomVoice', customVoiceSchema);

module.exports = CustomVoice;
