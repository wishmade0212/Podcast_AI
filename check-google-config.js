#!/usr/bin/env node

/**
 * Google Cloud API Status Checker
 * Quickly check if your Google APIs are properly configured
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n🔍 Checking Google Cloud API Configuration...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let allConfigured = true;

// Check Document AI Configuration
console.log('📄 DOCUMENT AI:');
const docAIChecks = {
  'Project ID': process.env.GOOGLE_CLOUD_PROJECT_ID,
  'Location': process.env.GOOGLE_CLOUD_LOCATION,
  'Processor ID': process.env.GOOGLE_CLOUD_PROCESSOR_ID,
  'Credentials Path': process.env.GOOGLE_APPLICATION_CREDENTIALS
};

Object.entries(docAIChecks).forEach(([key, value]) => {
  if (value) {
    console.log(`  ✅ ${key}: ${value}`);
  } else {
    console.log(`  ❌ ${key}: NOT SET`);
    allConfigured = false;
  }
});

// Check credentials file exists
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (fs.existsSync(credPath)) {
    const stats = fs.statSync(credPath);
    console.log(`  ✅ Credentials file exists (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  ❌ Credentials file NOT FOUND: ${credPath}`);
    allConfigured = false;
  }
}

console.log('\n🤖 VERTEX AI:');
const vertexAIChecks = {
  'Project ID': process.env.VERTEX_AI_PROJECT_ID,
  'Location': process.env.VERTEX_AI_LOCATION,
  'Model': process.env.VERTEX_AI_MODEL
};

Object.entries(vertexAIChecks).forEach(([key, value]) => {
  if (value) {
    console.log(`  ✅ ${key}: ${value}`);
  } else {
    console.log(`  ❌ ${key}: NOT SET`);
    allConfigured = false;
  }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (allConfigured) {
  console.log('✅ ALL CONFIGURED! Google AI is ready to use.\n');
  console.log('Next steps:');
  console.log('  1. Start server: npm start');
  console.log('  2. Look for success messages');
  console.log('  3. Upload a document to test!\n');
} else {
  console.log('⚠️  NOT CONFIGURED: Using fallback methods\n');
  console.log('To enable Google AI:');
  console.log('  • Run: npm run setup:google');
  console.log('  • Or follow: SETUP_NOW.md\n');
  console.log('Your app works fine without Google AI!');
  console.log('Google AI just makes it better. 🚀\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
