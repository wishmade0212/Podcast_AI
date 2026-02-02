const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt'],
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  filePath: {
    type: String, // Local path or GCS path
  },
  fileUrl: {
    type: String, // Direct URL or signed URL
  },
  gcsPath: {
    type: String, // Google Cloud Storage file path
  },
  storageType: {
    type: String,
    enum: ['local', 'gcs', 'gridfs'],
    default: 'local',
  },
  extractedText: {
    type: String,
    required: true,
  },
  wordCount: {
    type: Number,
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

module.exports = mongoose.model('Document', documentSchema);