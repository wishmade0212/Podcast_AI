const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const elevenLabs = require('../services/elevenLabs');
const CustomVoice = require('../models/CustomVoice');
const { protect: auth } = require('../middleware/auth');

// Configure multer for voice sample uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/voice-samples');
        try {
            await fs.mkdir(dir, { recursive: true });
            cb(null, dir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'sample-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 25 // Maximum 25 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/x-m4a'];
        const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
        
        const hasValidType = allowedTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));
        
        if (hasValidType || hasValidExtension) {
            return cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed!'));
        }
    }
}).array('audioFiles', 25); // Changed from 'samples' to 'audioFiles' and made it a configured upload

// Get all available voices (default + custom)
router.get('/voices', auth, async (req, res) => {
    try {
        // Get ElevenLabs voices (returns empty array if API key not set)
        const elevenLabsVoices = await elevenLabs.getVoices();
        
        // Get user's custom voices from database
        const customVoices = await CustomVoice.find({ userId: req.user.id });

        // Format voices for frontend
        const allVoices = [
            ...elevenLabsVoices.map(v => ({
                voiceId: v.voice_id,
                name: v.name,
                description: v.description || '',
                isCustom: false
            })),
            ...customVoices.map(v => ({
                voiceId: v.voiceId,
                name: v.name,
                description: v.description || '',
                isCustom: true
            }))
        ];

        res.json({
            success: true,
            voices: allVoices
        });
    } catch (error) {
        console.error('Error fetching voices:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching voices',
            error: error.message
        });
    }
});

// Clone a voice from audio samples
router.post('/clone', auth, upload, async (req, res) => {
    try {
        const { name, description } = req.body;
        const audioFiles = req.files;

        console.log('🎤 Voice cloning request:', { name, fileCount: audioFiles?.length });

        if (!name || !audioFiles || audioFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Voice name and at least one audio sample are required'
            });
        }

        // Clone voice with ElevenLabs
        console.log('📤 Uploading to ElevenLabs...');
        const filePaths = audioFiles.map(file => file.path);
        const clonedVoice = await elevenLabs.cloneVoice(name, filePaths, description);
        console.log('✅ ElevenLabs clone successful:', clonedVoice.voice_id);

        // Save to database
        const customVoice = new CustomVoice({
            userId: req.user.id,
            name: name,
            description: description || '',
            voiceId: clonedVoice.voice_id,
            provider: 'elevenlabs',
            sampleFiles: audioFiles.map(file => file.filename)
        });

        await customVoice.save();
        console.log('💾 Saved to database');

        // Clean up uploaded files after successful cloning
        for (const filePath of filePaths) {
            await fs.unlink(filePath).catch(err => console.error('Cleanup error:', err));
        }

        res.json({
            success: true,
            message: 'Voice cloned successfully!',
            voice: {
                voiceId: customVoice.voiceId,
                name: customVoice.name,
                description: customVoice.description,
                isCustom: true
            }
        });
    } catch (error) {
        console.error('❌ Error cloning voice:', error.response?.data || error.message);
        
        // Clean up files on error
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch(() => {});
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Error cloning voice',
            error: error.response?.data?.detail?.message || error.message
        });
    }
});

// Generate speech with a cloned voice
router.post('/generate', auth, async (req, res) => {
    try {
        const { text, voiceId } = req.body;

        if (!text || !voiceId) {
            return res.status(400).json({
                success: false,
                message: 'Text and voice ID are required'
            });
        }

        // Generate unique filename
        const filename = `voice-${Date.now()}.mp3`;
        const outputPath = path.join(__dirname, '../uploads/audio', filename);

        // Ensure directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true });

        // Generate speech
        await elevenLabs.textToSpeech(text, voiceId, outputPath);

        res.json({
            success: true,
            message: 'Speech generated successfully!',
            audioUrl: `/uploads/audio/${filename}`
        });
    } catch (error) {
        console.error('Error generating speech:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating speech',
            error: error.message
        });
    }
});

// Delete a custom voice
router.delete('/voices/:id', auth, async (req, res) => {
    try {
        const customVoice = await CustomVoice.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!customVoice) {
            return res.status(404).json({
                success: false,
                message: 'Voice not found'
            });
        }

        // Try to delete from ElevenLabs (don't fail if it doesn't exist there)
        try {
            await elevenLabs.deleteVoice(customVoice.voiceId);
        } catch (elevenLabsError) {
            console.warn('Could not delete from ElevenLabs (may already be deleted):', elevenLabsError.message);
            // Continue with local deletion even if ElevenLabs deletion fails
        }

        // Delete from database
        await customVoice.deleteOne();

        // Delete sample files (best effort)
        if (customVoice.sampleFiles && customVoice.sampleFiles.length > 0) {
            for (const filename of customVoice.sampleFiles) {
                try {
                    const filePath = path.join(__dirname, '../uploads/voice-samples', filename);
                    await fs.unlink(filePath);
                } catch (fileError) {
                    console.warn(`Could not delete sample file ${filename}:`, fileError.message);
                }
            }
        }

        res.json({
            success: true,
            message: 'Voice deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting voice:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting voice',
            error: error.message
        });
    }
});

// Get voice details
router.get('/voices/:id', auth, async (req, res) => {
    try {
        const customVoice = await CustomVoice.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!customVoice) {
            return res.status(404).json({
                success: false,
                message: 'Voice not found'
            });
        }

        // Get details from ElevenLabs
        const voiceDetails = await elevenLabs.getVoiceDetails(customVoice.voiceId);

        res.json({
            success: true,
            voice: {
                ...customVoice.toObject(),
                elevenLabsDetails: voiceDetails
            }
        });
    } catch (error) {
        console.error('Error fetching voice details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching voice details',
            error: error.message
        });
    }
});

module.exports = router;
