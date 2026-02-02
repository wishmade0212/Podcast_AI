const express = require('express');
const multer = require('multer');
let GridFsStorage = null;
try {
    const GridFsStorageModule = require('multer-gridfs-storage');
    GridFsStorage = GridFsStorageModule.GridFsStorage || GridFsStorageModule;
} catch (error) {
    console.warn('⚠️  multer-gridfs-storage not installed. Using disk storage for custom voices.');
}
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const CustomVoice = require('../models/CustomVoice');
const FormData = require('form-data');
const axios = require('axios');
const stream = require('stream');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// RVC Service Configuration
const RVC_SERVICE_URL = process.env.RVC_SERVICE_URL || 'http://localhost:5000';

// Configure GridFS storage for voice audio files (fallback to disk if not available)
let storage;

if (GridFsStorage) {
    storage = new GridFsStorage({
        db: mongoose.connection,
        file: (req, file) => {
            return {
                filename: `voice_${Date.now()}_${file.originalname}`,
                bucketName: 'uploads',
                metadata: {
                    userId: req.user._id,
                    type: 'custom-voice',
                    originalName: file.originalname
                }
            };
        }
    });
} else {
    // Fallback to disk storage
    storage = multer.diskStorage({
        destination: async (req, file, cb) => {
            const dir = path.join(__dirname, '../uploads/custom-voices');
            try {
                await fs.mkdir(dir, { recursive: true });
                cb(null, dir);
            } catch (error) {
                cb(error);
            }
        },
        filename: (req, file, cb) => {
            cb(null, `voice_${Date.now()}_${file.originalname}`);
        }
    });
}

// File filter for audio files only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/m4a'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP3, WAV, OGG, and M4A files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// @desc    Upload a custom voice sample
// @route   POST /api/custom-voices/upload
// @access  Private
router.post('/upload', protect, upload.single('voiceAudio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded'
      });
    }

    const { name, description, gender, language, accent, tags } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Voice name is required'
      });
    }

    // Get file format from mimetype
    const formatMap = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/x-m4a': 'm4a',
      'audio/m4a': 'm4a'
    };

    const format = formatMap[req.file.mimetype] || 'mp3';

    // Create custom voice record
    const customVoice = await CustomVoice.create({
      user: req.user._id,
      name: name.trim(),
      description: description?.trim() || '',
      audioFileId: req.file.id,
      audioFileName: req.file.filename,
      audioFileSize: req.file.size,
      duration: 0, // Will be updated after processing
      format: format,
      status: 'uploaded',
      gender: gender || 'unknown',
      language: language || 'en-US',
      accent: accent || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    console.log(`🎤 Custom voice uploaded: ${customVoice.name} by user ${req.user.email}`);

    // Start RVC model training in background
    trainRVCModel(customVoice._id.toString(), req.file.id, customVoice.name)
      .then(() => {
        console.log(`✅ RVC training started for voice: ${customVoice.name}`);
      })
      .catch(err => {
        console.error(`❌ RVC training failed for voice: ${customVoice.name}`, err);
      });

    res.status(201).json({
      success: true,
      message: 'Voice sample uploaded successfully. Training will begin shortly.',
      voice: customVoice
    });

  } catch (error) {
    console.error('Error uploading voice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload voice sample',
      error: error.message
    });
  }
});

// @desc    Get all custom voices for the authenticated user
// @route   GET /api/custom-voices
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const voices = await CustomVoice.findByUser(req.user._id);

    res.json({
      success: true,
      count: voices.length,
      voices: voices
    });

  } catch (error) {
    console.error('Error fetching custom voices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom voices',
      error: error.message
    });
  }
});

// @desc    Get a specific custom voice
// @route   GET /api/custom-voices/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const voice = await CustomVoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!voice) {
      return res.status(404).json({
        success: false,
        message: 'Voice not found'
      });
    }

    res.json({
      success: true,
      voice: voice
    });

  } catch (error) {
    console.error('Error fetching voice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voice',
      error: error.message
    });
  }
});

// @desc    Stream audio file for a custom voice
// @route   GET /api/custom-voices/:id/audio
// @access  Private
router.get('/:id/audio', protect, async (req, res) => {
  try {
    const voice = await CustomVoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!voice) {
      return res.status(404).json({
        success: false,
        message: 'Voice not found'
      });
    }

    const GridFSBucket = mongoose.mongo.GridFSBucket;
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

    // Set response headers
    res.set('Content-Type', `audio/${voice.format}`);
    res.set('Accept-Ranges', 'bytes');

    // Stream the file
    const downloadStream = bucket.openDownloadStream(voice.audioFileId);

    downloadStream.on('error', (error) => {
      console.error('Error streaming audio:', error);
      res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error('Error streaming audio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stream audio',
      error: error.message
    });
  }
});

// @desc    Update a custom voice
// @route   PUT /api/custom-voices/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, gender, language, accent, tags, isDefault } = req.body;

    const voice = await CustomVoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!voice) {
      return res.status(404).json({
        success: false,
        message: 'Voice not found'
      });
    }

    // Update fields
    if (name) voice.name = name.trim();
    if (description !== undefined) voice.description = description.trim();
    if (gender) voice.gender = gender;
    if (language) voice.language = language;
    if (accent !== undefined) voice.accent = accent;
    if (tags) voice.tags = tags.split(',').map(tag => tag.trim());

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await CustomVoice.updateMany(
        { user: req.user._id, _id: { $ne: voice._id } },
        { $set: { isDefault: false } }
      );
      voice.isDefault = true;
    } else if (isDefault === false) {
      voice.isDefault = false;
    }

    await voice.save();

    res.json({
      success: true,
      message: 'Voice updated successfully',
      voice: voice
    });

  } catch (error) {
    console.error('Error updating voice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update voice',
      error: error.message
    });
  }
});

// @desc    Delete a custom voice
// @route   DELETE /api/custom-voices/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const voice = await CustomVoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!voice) {
      return res.status(404).json({
        success: false,
        message: 'Voice not found'
      });
    }

    // Delete audio file from GridFS
    try {
      const GridFSBucket = mongoose.mongo.GridFSBucket;
      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      await bucket.delete(voice.audioFileId);
      console.log(`🗑️  Deleted audio file for voice ${voice.name}`);
    } catch (error) {
      console.error('Error deleting audio file:', error);
    }

    // Delete the voice record (using deleteOne instead of deprecated remove)
    await CustomVoice.deleteOne({ _id: voice._id });

    console.log(`🗑️  Deleted custom voice: ${voice.name}`);

    res.json({
      success: true,
      message: 'Voice deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting voice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete voice',
      error: error.message
    });
  }
});

// @desc    Test a custom voice with sample text (placeholder)
// @route   POST /api/custom-voices/:id/test
// @access  Private
router.post('/:id/test', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for testing'
      });
    }

    const voice = await CustomVoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!voice) {
      return res.status(404).json({
        success: false,
        message: 'Voice not found'
      });
    }

    if (voice.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Voice is not ready for testing. Please wait for processing to complete.'
      });
    }

    // TODO: Integrate with voice cloning service (ElevenLabs, Play.ht, etc.)
    // For now, return a placeholder response
    
    res.json({
      success: true,
      message: 'Voice testing feature coming soon!',
      note: 'This feature requires integration with a voice cloning service like ElevenLabs or Play.ht'
    });

  } catch (error) {
    console.error('Error testing voice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test voice',
      error: error.message
    });
  }
});

// Helper function to train RVC model
async function trainRVCModel(voiceId, audioFileId, voiceName) {
  try {
    console.log(`🔄 Starting RVC training for voice: ${voiceName}`);
    
    // Update status to processing
    await CustomVoice.findByIdAndUpdate(voiceId, {
      status: 'processing'
    });
    
    // Get audio file from GridFS
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    
    // Create audio stream
    const audioStream = bucket.openDownloadStream(audioFileId);
    
    // Prepare form data for RVC service
    const formData = new FormData();
    formData.append('audio', audioStream, {
      filename: `${voiceId}.wav`,
      contentType: 'audio/wav'
    });
    formData.append('voice_id', voiceId);
    formData.append('voice_name', voiceName);
    
    // Send to RVC service for training
    const response = await axios.post(`${RVC_SERVICE_URL}/train`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30 * 60 * 1000 // 30 minutes timeout for training
    });
    
    if (response.data.success) {
      // Update status to ready
      await CustomVoice.findByIdAndUpdate(voiceId, {
        status: 'ready',
        modelPath: response.data.model_path
      });
      
      console.log(`✅ RVC training completed for voice: ${voiceName}`);
    } else {
      throw new Error(response.data.error || 'Training failed');
    }
    
  } catch (error) {
    console.error(`❌ RVC training error for voice ${voiceName}:`, error.message);
    
    // Update status to failed
    await CustomVoice.findByIdAndUpdate(voiceId, {
      status: 'failed'
    });
  }
}

// Helper function to convert audio using RVC
async function convertAudioWithRVC(modelId, inputAudioStream) {
  try {
    console.log(`🔄 Converting audio with RVC model: ${modelId}`);
    
    // Prepare form data
    const formData = new FormData();
    formData.append('audio', inputAudioStream, {
      filename: 'input.wav',
      contentType: 'audio/wav'
    });
    formData.append('model_id', modelId);
    
    // Send to RVC service for conversion
    const response = await axios.post(`${RVC_SERVICE_URL}/convert`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      responseType: 'stream',
      timeout: 5 * 60 * 1000 // 5 minutes timeout
    });
    
    return response.data;
    
  } catch (error) {
    console.error(`❌ RVC conversion error:`, error.message);
    throw error;
  }
}

module.exports = router;

