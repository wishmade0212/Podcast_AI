const express = require('express');
const Summary = require('../models/Summary');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const summarizeText = require('../services/summarization');

const router = express.Router();

// @desc    Generate summary for a document
// @route   POST /api/summaries
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ success: false, message: 'Please provide a document ID' });
    }
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Make sure user owns the document
    if (document.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this document' });
    }
    
    // Check if summary already exists
    const existingSummary = await Summary.findOne({ document: documentId });
    if (existingSummary) {
      return res.status(400).json({ success: false, message: 'Summary already exists for this document' });
    }
    
    // Validate document has text and word count
    if (!document.extractedText || !document.wordCount || document.wordCount === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document has no content or invalid word count. Please re-upload the document.' 
      });
    }
    
    // Generate summary text FIRST
    const summaryText = await summarizeText(document.extractedText);
    const summaryWordCount = summaryText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate compression ratio with safety check
    let compressionRatio = 0;
    if (document.wordCount > 0 && summaryWordCount > 0) {
      compressionRatio = parseFloat((summaryWordCount / document.wordCount).toFixed(2));
    }
    
    const readingTime = Math.ceil(summaryWordCount / 200); // Assuming 200 words per minute
    
    // Create summary with all required fields
    const summary = await Summary.create({
      user: req.user.id,
      document: documentId,
      summaryText,
      wordCount: summaryWordCount,
      compressionRatio,
      readingTime,
      processingStatus: 'completed',
    });
    
    res.status(201).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error(error);
    
    // If summary was created, update status to failed
    if (req.body.documentId) {
      try {
        const summary = await Summary.findOne({
          user: req.user.id,
          document: req.body.documentId,
        });
        if (summary) {
          summary.processingStatus = 'failed';
          await summary.save();
        }
      } catch (updateError) {
        console.error('Error updating summary status:', updateError);
      }
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all summaries for a user
// @route   GET /api/summaries
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const summaries = await Summary.find({ user: req.user.id })
      .populate({
        path: 'document',
        select: 'title originalName fileType',
      })
      .sort({ createdAt: -1 });
    
    // Filter out summaries with deleted documents
    const validSummaries = summaries.filter(summary => summary.document !== null);
    
    res.status(200).json({
      success: true,
      count: validSummaries.length,
      summaries: validSummaries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single summary
// @route   GET /api/summaries/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id).populate({
      path: 'document',
      select: 'title originalName fileType extractedText',
    });
    
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Summary not found' });
    }
    
    // Make sure user owns the summary
    if (summary.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this summary' });
    }
    
    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Generate multiple summaries
// @route   POST /api/summaries/bulk-generate
// @access  Private
router.post('/bulk-generate', protect, async (req, res) => {
  try {
    const { documentIds } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid document IDs' });
    }
    
    const results = [];
    
    for (const documentId of documentIds) {
      try {
        const document = await Document.findById(documentId);
        
        if (!document) {
          results.push({ documentId, success: false, message: 'Document not found' });
          continue;
        }
        
        // Make sure user owns the document
        if (document.user.toString() !== req.user.id) {
          results.push({ documentId, success: false, message: 'Not authorized to access this document' });
          continue;
        }
        
        // Check if summary already exists
        const existingSummary = await Summary.findOne({ document: documentId });
        if (existingSummary) {
          results.push({ documentId, success: false, message: 'Summary already exists' });
          continue;
        }
        
        // Create summary with processing status
        const summary = await Summary.create({
          user: req.user.id,
          document: documentId,
          processingStatus: 'processing',
        });
        
        // Generate summary
        const summaryText = await summarizeText(document.extractedText);
        const summaryWordCount = summaryText.split(/\s+/).filter(word => word.length > 0).length;
        const compressionRatio = (summaryWordCount / document.wordCount).toFixed(2);
        const readingTime = Math.ceil(summaryWordCount / 200); // Assuming 200 words per minute
        
        // Update summary with generated text
        summary.summaryText = summaryText;
        summary.wordCount = summaryWordCount;
        summary.compressionRatio = compressionRatio;
        summary.readingTime = readingTime;
        summary.processingStatus = 'completed';
        await summary.save();
        
        results.push({ documentId, success: true, summaryId: summary._id });
      } catch (error) {
        console.error(`Error generating summary for document ${documentId}:`, error);
        results.push({ documentId, success: false, message: error.message });
      }
    }
    
    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete summary
// @route   DELETE /api/summaries/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);
    
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Summary not found' });
    }
    
    // Make sure user owns the summary
    if (summary.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this summary' });
    }
    
    // Delete associated podcasts (cascade delete)
    const Podcast = require('../models/Podcast');
    await Podcast.deleteMany({ summary: req.params.id });
    
    await summary.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Summary deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;