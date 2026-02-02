// Google Cloud Document AI service for advanced text extraction
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

let documentAIClient = null;
let isConfigured = false;

// Initialize Google Document AI client
function initializeDocumentAI() {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
    const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID;

    if (!projectId || !processorId) {
      console.log('⚠️  Google Document AI not configured - using fallback extraction');
      return false;
    }

    // Initialize the client - will use GOOGLE_APPLICATION_CREDENTIALS env var automatically
    documentAIClient = new DocumentProcessorServiceClient();
    isConfigured = true;
    
    console.log('✅ Google Document AI configured successfully');
    return true;
  } catch (error) {
    console.log('⚠️  Google Document AI initialization failed - using fallback extraction');
    console.log('   Error:', error.message);
    return false;
  }
}

// Extract text using Google Document AI
async function extractTextWithDocumentAI(fileBuffer, mimeType) {
  if (!isConfigured) {
    throw new Error('Google Document AI not configured');
  }

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
    const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID;

    // Construct the processor name
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    // Convert buffer to base64
    const encodedContent = fileBuffer.toString('base64');

    // Prepare the request
    const request = {
      name,
      rawDocument: {
        content: encodedContent,
        mimeType: mimeType,
      },
    };

    // Process the document
    console.log('Processing document with Google Document AI...');
    const [result] = await documentAIClient.processDocument(request);
    
    const { document } = result;
    const text = document.text || '';
    
    console.log(`✅ Extracted ${text.length} characters using Google Document AI`);
    
    return text;
  } catch (error) {
    console.error('Google Document AI extraction error:', error.message);
    throw error;
  }
}

// Get MIME type from file type
function getMimeType(fileType) {
  const mimeTypes = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
  };
  return mimeTypes[fileType] || 'application/octet-stream';
}

module.exports = {
  initializeDocumentAI,
  extractTextWithDocumentAI,
  getMimeType,
  isConfigured: () => isConfigured,
};
