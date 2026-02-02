const mongoose = require('mongoose');

const podcastSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  document: {
    type: mongoose.Schema.ObjectId,
    ref: 'Document',
    required: true,
  },
  summary: {
    type: mongoose.Schema.ObjectId,
    ref: 'Summary',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  audioUrl: {
    type: String,
  },
  audioText: {
    type: String, // Store text for browser TTS synthesis
  },
  audioSignedUrl: {
    type: String, // Temporary signed URL for accessing audio (GCS)
  },
  gcsPath: {
    type: String, // Google Cloud Storage file path
  },
  storageType: {
    type: String,
    enum: ['local', 'gcs', 'browser', 'gridfs'],
    default: 'local',
  },
  audioSize: {
    type: Number,
  },
  duration: {
    type: Number, // in seconds
  },
  voiceProvider: {
    type: String,
    required: true,
  },
  voiceSettings: {
    speed: {
      type: Number,
      default: 1.0,
    },
    pitch: {
      type: Number,
      default: 1.0,
    },
    volume: {
      type: Number,
      default: 1.0,
    },
    voice: {
      type: String,
      required: true,
      default: 'default',
    },
  },
  customVoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'CustomVoice',
  },
  convertedAudioUrl: {
    type: String, // URL for voice-converted audio
  },
  conversionStatus: {
    type: String,
    enum: ['none', 'pending', 'processing', 'completed', 'failed'],
    default: 'none',
  },
  sourceType: {
    type: String,
    enum: ['full_document', 'summary'],
    required: true,
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Podcast', podcastSchema);