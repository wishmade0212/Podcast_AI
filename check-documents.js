// Script to check documents in database
const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();

async function checkDocuments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/podcast-generator');
    console.log('MongoDB Connected\n');

    const documents = await Document.find({});
    console.log(`Found ${documents.length} documents:\n`);

    documents.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`);
      console.log(`  ID: ${doc._id}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Has extractedText: ${!!doc.extractedText}`);
      console.log(`  extractedText length: ${doc.extractedText ? doc.extractedText.length : 0}`);
      console.log(`  wordCount: ${doc.wordCount}`);
      console.log(`  processingStatus: ${doc.processingStatus}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDocuments();
