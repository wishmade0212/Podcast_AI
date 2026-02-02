#!/usr/bin/env node

/**
 * Interactive Google Cloud Setup Script
 * This script helps you configure Google Cloud APIs step by step
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

console.log('\n🚀 Google Cloud AI Setup Wizard\n');
console.log('This wizard will help you configure:');
console.log('  ✓ Google Cloud Document AI (for better text extraction)');
console.log('  ✓ Google Cloud Vertex AI (for AI-powered summarization)\n');

async function main() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 1: Check if user wants to continue
    console.log('📋 STEP 1: Prerequisites Check\n');
    console.log('Before starting, make sure you have:');
    console.log('  • Google Cloud account');
    console.log('  • Credit card for verification (free tier available)');
    console.log('  • 15-20 minutes\n');
    
    const shouldContinue = await question('Do you want to continue? (yes/no): ');
    if (shouldContinue.toLowerCase() !== 'yes' && shouldContinue.toLowerCase() !== 'y') {
      console.log('\n❌ Setup cancelled. You can run this script anytime!');
      process.exit(0);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 2: Create Google Cloud Project
    console.log('📦 STEP 2: Create Google Cloud Project\n');
    console.log('1. Open: https://console.cloud.google.com/');
    console.log('2. Click "Select a project" → "New Project"');
    console.log('3. Enter project name: "podcast-generator"');
    console.log('4. Click "Create"\n');
    
    await question('Press ENTER when project is created... ');
    
    const projectId = await question('\nEnter your Project ID (e.g., podcast-generator-123456): ');
    if (!projectId.trim()) {
      console.log('\n❌ Project ID is required!');
      process.exit(1);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 3: Enable APIs
    console.log('🔌 STEP 3: Enable Required APIs\n');
    console.log('Enable Document AI API:');
    console.log(`  https://console.cloud.google.com/apis/library/documentai.googleapis.com?project=${projectId}`);
    console.log('\nEnable Vertex AI API:');
    console.log(`  https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}\n`);
    
    await question('Press ENTER when both APIs are enabled... ');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 4: Create Document AI Processor
    console.log('📄 STEP 4: Create Document AI Processor\n');
    console.log('1. Go to: https://console.cloud.google.com/ai/document-ai/processors');
    console.log('2. Click "Create Processor"');
    console.log('3. Select "Document OCR"');
    console.log('4. Choose region (us, eu, or asia)');
    console.log('5. Click "Create"\n');
    
    const location = await question('Enter your processor region (us/eu/asia): ');
    await question('Press ENTER when processor is created... ');
    
    const processorId = await question('\nEnter your Processor ID (long alphanumeric string): ');
    if (!processorId.trim()) {
      console.log('\n❌ Processor ID is required!');
      process.exit(1);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 5: Create Service Account
    console.log('👤 STEP 5: Create Service Account\n');
    console.log(`1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=${projectId}`);
    console.log('2. Click "Create Service Account"');
    console.log('3. Name: "podcast-app-service"');
    console.log('4. Add roles:');
    console.log('   • Document AI API User');
    console.log('   • Vertex AI User');
    console.log('5. Click through to complete\n');
    
    await question('Press ENTER when service account is created... ');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 6: Download Key
    console.log('🔑 STEP 6: Download Service Account Key\n');
    console.log('1. Click on the service account you created');
    console.log('2. Go to "Keys" tab');
    console.log('3. Click "Add Key" → "Create new key"');
    console.log('4. Choose JSON format');
    console.log('5. Save the downloaded file as "google-credentials.json"');
    console.log('6. Move it to your project folder: D:\\Pod-app-zai\n');
    
    await question('Press ENTER when google-credentials.json is in D:\\Pod-app-zai... ');
    
    // Verify file exists
    const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      console.log('\n❌ Error: google-credentials.json not found!');
      console.log('Please place the file in: D:\\Pod-app-zai\\');
      process.exit(1);
    }
    
    console.log('✅ Credentials file found!\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 7: Update .env
    console.log('⚙️  STEP 7: Updating .env file...\n');
    
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update or add configuration
    const config = {
      GOOGLE_CLOUD_PROJECT_ID: projectId,
      GOOGLE_CLOUD_LOCATION: location || 'us',
      GOOGLE_CLOUD_PROCESSOR_ID: processorId,
      GOOGLE_APPLICATION_CREDENTIALS: './google-credentials.json',
      VERTEX_AI_PROJECT_ID: projectId,
      VERTEX_AI_LOCATION: 'us-central1',
      VERTEX_AI_MODEL: 'gemini-1.5-flash'
    };
    
    // Remove commented lines for these configs
    Object.keys(config).forEach(key => {
      const commentedLine = new RegExp(`# ${key}=.*`, 'g');
      envContent = envContent.replace(commentedLine, '');
    });
    
    // Add active configurations
    const googleCloudSection = `
# Google Cloud Document AI Configuration
GOOGLE_CLOUD_PROJECT_ID=${config.GOOGLE_CLOUD_PROJECT_ID}
GOOGLE_CLOUD_LOCATION=${config.GOOGLE_CLOUD_LOCATION}
GOOGLE_CLOUD_PROCESSOR_ID=${config.GOOGLE_CLOUD_PROCESSOR_ID}
GOOGLE_APPLICATION_CREDENTIALS=${config.GOOGLE_APPLICATION_CREDENTIALS}

# Google Cloud Vertex AI Configuration
VERTEX_AI_PROJECT_ID=${config.VERTEX_AI_PROJECT_ID}
VERTEX_AI_LOCATION=${config.VERTEX_AI_LOCATION}
VERTEX_AI_MODEL=${config.VERTEX_AI_MODEL}
`;
    
    // Remove old Google Cloud sections
    envContent = envContent.replace(/# Google Cloud Document AI Configuration[\s\S]*?# GOOGLE_APPLICATION_CREDENTIALS=.*\n/g, '');
    envContent = envContent.replace(/# Google Cloud Vertex AI Configuration[\s\S]*?# GOOGLE_APPLICATION_CREDENTIALS=.*\n/g, '');
    
    // Add new configuration at the end
    envContent = envContent.trim() + '\n' + googleCloudSection;
    
    // Write updated .env
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env file updated successfully!\n');
    console.log('Configuration:');
    console.log(`  • Project ID: ${projectId}`);
    console.log(`  • Location: ${location}`);
    console.log(`  • Processor ID: ${processorId}`);
    console.log(`  • Model: gemini-1.5-flash\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 8: Restart Server
    console.log('🎉 SETUP COMPLETE!\n');
    console.log('Next steps:');
    console.log('  1. Restart your server: npm start');
    console.log('  2. You should see:');
    console.log('     ✅ Google Document AI configured successfully');
    console.log('     ✅ Vertex AI configured successfully');
    console.log('  3. Upload a document and test!\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
