// Database cleanup script to remove invalid documents
const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/podcast-generator');
    console.log('MongoDB Connected');

    // Find documents without required fields
    const invalidDocuments = await Document.find({
      $or: [
        { extractedText: { $exists: false } },
        { extractedText: null },
        { extractedText: '' },
        { wordCount: { $exists: false } },
        { wordCount: null },
        { wordCount: 0 }
      ]
    });

    console.log(`Found ${invalidDocuments.length} invalid documents`);

    if (invalidDocuments.length > 0) {
      // Delete invalid documents
      const result = await Document.deleteMany({
        _id: { $in: invalidDocuments.map(doc => doc._id) }
      });

      console.log(`Deleted ${result.deletedCount} invalid documents`);
    }

    console.log('✅ Database cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDatabase();
