const express = require('express');
const Podcast = require('../models/Podcast');
const Document = require('../models/Document');
const Summary = require('../models/Summary');
const { protect } = require('../middleware/auth');
const { generateAudio } = require('../services/tts');

const router = express.Router();

// @desc    Create podcast from document
// @route   POST /api/podcasts
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { 
      documentId, 
      title, 
      description, 
      sourceType, 
      voiceProvider, 
      voiceSettings 
    } = req.body;
    
    if (!documentId || !title || !sourceType || !voiceProvider || !voiceSettings) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    
    // Validate voiceSettings has required fields
    if (!voiceSettings.voice || voiceSettings.voice.trim() === '') {
      return res.status(400).json({ success: false, message: 'Voice selection is required' });
    }
    
    // Set default values for voiceSettings if not provided
    const finalVoiceSettings = {
      voice: voiceSettings.voice,
      speed: voiceSettings.speed || 1.0,
      pitch: voiceSettings.pitch || 1.0,
      volume: voiceSettings.volume || 1.0
    };
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Make sure user owns the document
    if (document.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this document' });
    }
    
    // If source is summary, check if summary exists
    let summary = null;
    if (sourceType === 'summary') {
      summary = await Summary.findOne({ document: documentId });
      if (!summary) {
        return res.status(404).json({ success: false, message: 'Summary not found for this document' });
      }
    }
    
    // Create podcast with processing status
    const podcast = await Podcast.create({
      user: req.user.id,
      document: documentId,
      summary: summary ? summary._id : undefined,
      title,
      description,
      sourceType,
      voiceProvider,
      voiceSettings: finalVoiceSettings,
      processingStatus: 'processing',
    });
    
    // Determine text to convert
    const textToConvert = sourceType === 'summary' ? summary.summaryText : document.extractedText;
    
    // For browser TTS, skip server-side audio generation
    // The browser will generate audio on the client side
    if (voiceProvider === 'browser') {
      // Store the text for client-side synthesis
      podcast.audioUrl = 'browser-tts'; // Special marker
      podcast.audioText = textToConvert; // Store text for browser synthesis
      podcast.audioSize = textToConvert.length; // Text size in bytes
      
      // Estimate duration based on text length (approximate)
      const wordCount = textToConvert.split(/\s+/).filter(word => word.length > 0).length;
      const wordsPerSecond = 2.5 * (finalVoiceSettings.speed || 1.0);
      podcast.duration = Math.ceil(wordCount / wordsPerSecond);
      
      podcast.audioSignedUrl = null;
      podcast.gcsPath = null;
      podcast.storageType = 'browser';
      podcast.processingStatus = 'completed';
      await podcast.save();
    } else {
      // Generate audio with user ID for cloud storage organization (for Google TTS)
      const audioResult = await generateAudio(textToConvert, voiceProvider, finalVoiceSettings, req.user.id);
      
      // Update podcast with audio details
      podcast.audioUrl = audioResult.url;
      podcast.audioSize = audioResult.size;
      podcast.duration = audioResult.duration;
      podcast.audioSignedUrl = audioResult.signedUrl;
      podcast.gcsPath = audioResult.gcsPath;
      podcast.storageType = audioResult.storageType;
      podcast.processingStatus = 'completed';
      await podcast.save();
    }
    
    res.status(201).json({
      success: true,
      podcast,
    });
  } catch (error) {
    console.error(error);
    
    // If podcast was created, update status to failed
    if (req.body.documentId) {
      try {
        const podcast = await Podcast.findOne({
          user: req.user.id,
          document: req.body.documentId,
          title: req.body.title,
        });
        if (podcast) {
          podcast.processingStatus = 'failed';
          await podcast.save();
        }
      } catch (updateError) {
        console.error('Error updating podcast status:', updateError);
      }
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create podcast from summary
// @route   POST /api/podcasts/from-summary/:id
// @access  Private
router.post('/from-summary/:id', protect, async (req, res) => {
  try {
    const { title, description, voiceProvider, voiceSettings } = req.body;
    const summaryId = req.params.id;
    
    if (!title || !voiceProvider || !voiceSettings) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    
    // Validate voiceSettings has required fields
    if (!voiceSettings.voice || voiceSettings.voice.trim() === '') {
      return res.status(400).json({ success: false, message: 'Voice selection is required' });
    }
    
    // Set default values for voiceSettings if not provided
    const finalVoiceSettings = {
      voice: voiceSettings.voice,
      speed: voiceSettings.speed || 1.0,
      pitch: voiceSettings.pitch || 1.0,
      volume: voiceSettings.volume || 1.0
    };
    
    const summary = await Summary.findById(summaryId).populate('document');
    
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Summary not found' });
    }
    
    // Make sure user owns the summary
    if (summary.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this summary' });
    }
    
    // Create podcast with processing status
    const podcast = await Podcast.create({
      user: req.user.id,
      document: summary.document._id,
      summary: summaryId,
      title,
      description,
      sourceType: 'summary',
      voiceProvider,
      voiceSettings: finalVoiceSettings,
      processingStatus: 'processing',
    });
    
    // Generate audio with user ID for cloud storage organization
    const audioResult = await generateAudio(summary.summaryText, voiceProvider, finalVoiceSettings, req.user.id);
    
    // Update podcast with audio details
    podcast.audioUrl = audioResult.url;
    podcast.audioSize = audioResult.size;
    podcast.duration = audioResult.duration;
    podcast.audioSignedUrl = audioResult.signedUrl;
    podcast.gcsPath = audioResult.gcsPath;
    podcast.storageType = audioResult.storageType;
    podcast.processingStatus = 'completed';
    await podcast.save();
    
    res.status(201).json({
      success: true,
      podcast,
    });
  } catch (error) {
    console.error(error);
    
    // If podcast was created, update status to failed
    if (req.params.id) {
      try {
        const podcast = await Podcast.findOne({
          user: req.user.id,
          summary: req.params.id,
          title: req.body.title,
        });
        if (podcast) {
          podcast.processingStatus = 'failed';
          await podcast.save();
        }
      } catch (updateError) {
        console.error('Error updating podcast status:', updateError);
      }
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all podcasts for a user
// @route   GET /api/podcasts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const podcasts = await Podcast.find({ user: req.user.id })
      .populate({
        path: 'document',
        select: 'title originalName fileType',
      })
      .populate({
        path: 'summary',
        select: 'wordCount readingTime compressionRatio',
      })
      .sort({ createdAt: -1 });
    
    // Filter out podcasts with deleted documents
    const validPodcasts = podcasts.filter(podcast => podcast.document !== null);
    
    res.status(200).json({
      success: true,
      count: validPodcasts.length,
      podcasts: validPodcasts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single podcast
// @route   GET /api/podcasts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id)
      .populate({
        path: 'document',
        select: 'title originalName fileType extractedText',
      })
      .populate({
        path: 'summary',
        select: 'summaryText wordCount readingTime compressionRatio',
      });
    
    if (!podcast) {
      return res.status(404).json({ success: false, message: 'Podcast not found' });
    }
    
    // Make sure user owns the podcast
    if (podcast.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this podcast' });
    }
    
    res.status(200).json({
      success: true,
      podcast,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Download podcast audio
// @route   GET /api/podcasts/:id/download
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id).populate('document');
    
    if (!podcast) {
      return res.status(404).json({ success: false, message: 'Podcast not found' });
    }
    
    // Make sure user owns the podcast
    if (podcast.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to download this podcast' });
    }
    
    // Check if this is browser TTS (cannot be downloaded)
    if (podcast.storageType === 'browser' || podcast.audioUrl === 'browser-tts') {
      return res.status(400).json({ success: false, message: 'Browser TTS podcasts cannot be downloaded' });
    }
    
    const path = require('path');
    const fs = require('fs');
    
    // Determine file path based on storage type
    let filePath;
    
    if (podcast.storageType === 'gcs' && podcast.gcsPath) {
      // For cloud storage, redirect to signed URL
      if (podcast.audioSignedUrl) {
        return res.redirect(podcast.audioSignedUrl);
      }
      return res.status(404).json({ success: false, message: 'Audio file not available' });
    } else {
      // For local storage, serve the file
      if (podcast.audioUrl) {
        // Extract filename from audioUrl (e.g., '/uploads/audio/filename.mp3')
        const filename = podcast.audioUrl.split('/').pop();
        filePath = path.join(__dirname, '../uploads/audio', filename);
      } else {
        return res.status(404).json({ success: false, message: 'Audio file not found' });
      }
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Audio file not found on server' });
    }
    
    // Get document name for better filename
    let downloadFilename = 'podcast.mp3';
    if (podcast.document && podcast.document.originalName) {
      // Use document name without extension
      const docNameWithoutExt = podcast.document.originalName.replace(/\.[^/.]+$/, '');
      downloadFilename = `${docNameWithoutExt}.mp3`;
    } else if (podcast.title) {
      // Fallback to podcast title
      const safeTitle = podcast.title.replace(/[^a-z0-9]/gi, '_');
      downloadFilename = `${safeTitle}.mp3`;
    }
    
    // Set headers for download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete podcast
// @route   DELETE /api/podcasts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    
    if (!podcast) {
      return res.status(404).json({ success: false, message: 'Podcast not found' });
    }
    
    // Make sure user owns the podcast
    if (podcast.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this podcast' });
    }
    
    await podcast.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Podcast deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
