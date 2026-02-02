// Fix existing documents with wordCount = 0
const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();

async function fixDocuments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/podcast-generator');
    console.log('MongoDB Connected\n');

    const documents = await Document.find({ wordCount: 0 });
    console.log(`Found ${documents.length} documents with wordCount = 0\n`);

    for (const doc of documents) {
      if (doc.extractedText) {
        const words = doc.extractedText.trim().split(/\s+/);
        const newWordCount = doc.extractedText.trim() ? words.filter(word => word.length > 0).length : 0;
        
        console.log(`Fixing document: ${doc.title}`);
        console.log(`  Old wordCount: ${doc.wordCount}`);
        console.log(`  New wordCount: ${newWordCount}`);
        console.log(`  Text: "${doc.extractedText.substring(0, 50)}..."`);
        
        doc.wordCount = newWordCount;
        await doc.save();
        console.log(`  ✅ Updated\n`);
      }
    }

    console.log('✅ All documents fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDocuments();
