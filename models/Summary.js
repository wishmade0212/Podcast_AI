const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
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
  summaryText: {
    type: String,
    required: true,
  },
  wordCount: {
    type: Number,
    required: true,
  },
  compressionRatio: {
    type: Number,
    required: true,
  },
  readingTime: {
    type: Number, // in minutes
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

module.exports = mongoose.model('Summary', summarySchema);