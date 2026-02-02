// Google Cloud Vertex AI service for AI-powered summarization using Gemini
const { VertexAI } = require('@google-cloud/vertexai');

let vertexAI = null;
let isConfigured = false;

// Initialize Vertex AI client
function initializeVertexAI() {
  try {
    const projectId = process.env.VERTEX_AI_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

    if (!projectId) {
      console.log('⚠️  Vertex AI not configured - using fallback summarization');
      return false;
    }

    // Initialize Vertex AI - will use GOOGLE_APPLICATION_CREDENTIALS env var automatically
    vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });

    isConfigured = true;
    console.log('✅ Vertex AI configured successfully');
    console.log(`   Project: ${projectId}`);
    console.log(`   Location: ${location}`);
    return true;
  } catch (error) {
    console.log('⚠️  Vertex AI initialization failed - using fallback summarization');
    console.log('   Error:', error.message);
    return false;
  }
}

// Generate summary using Vertex AI Gemini model
async function generateSummaryWithVertexAI(text, options = {}) {
  if (!isConfigured) {
    throw new Error('Vertex AI not configured');
  }

  try {
    const modelName = process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash';
    const maxWords = options.maxWords || 150;
    const style = options.style || 'concise';
    
    console.log(`📝 Generating summary with Vertex AI (${modelName})...`);
    
    // Get the generative model
    const model = vertexAI.getGenerativeModel({
      model: modelName,
    });

    // Create a detailed prompt for summarization
    const prompt = `Please provide a ${style} summary of the following text. The summary should be approximately ${maxWords} words and capture the main ideas, key points, and essential information.

Format the summary as a clear, coherent paragraph that flows naturally. Focus on:
- Main topics and themes
- Key facts and findings
- Important conclusions or takeaways

Text to summarize:
${text}

Summary:`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.candidates[0].content.parts[0].text.trim();

    console.log(`✅ Generated summary: ${summary.length} characters`);
    
    return summary;
  } catch (error) {
    console.error('Vertex AI summarization error:', error.message);
    throw error;
  }
}

// Generate summary with specific parameters
async function summarizeText(text, options = {}) {
  if (!isConfigured) {
    throw new Error('Vertex AI not configured');
  }

  try {
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Determine target length based on input length
    let maxWords = options.maxWords;
    if (!maxWords) {
      if (wordCount < 500) {
        maxWords = 100;
      } else if (wordCount < 2000) {
        maxWords = 200;
      } else {
        maxWords = 300;
      }
    }

    console.log(`Input: ${wordCount} words → Target: ~${maxWords} words`);
    
    const summary = await generateSummaryWithVertexAI(text, {
      maxWords,
      style: options.style || 'concise',
    });

    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

// Generate multiple summary styles (short, medium, detailed)
async function generateMultipleSummaries(text) {
  if (!isConfigured) {
    throw new Error('Vertex AI not configured');
  }

  try {
    console.log('📝 Generating multiple summary versions...');
    
    const summaries = {
      brief: await generateSummaryWithVertexAI(text, { maxWords: 50, style: 'brief' }),
      standard: await generateSummaryWithVertexAI(text, { maxWords: 150, style: 'concise' }),
      detailed: await generateSummaryWithVertexAI(text, { maxWords: 300, style: 'detailed' }),
    };

    console.log('✅ Generated all summary versions');
    return summaries;
  } catch (error) {
    console.error('Error generating multiple summaries:', error);
    throw error;
  }
}

// Extract key points from text
async function extractKeyPoints(text, numPoints = 5) {
  if (!isConfigured) {
    throw new Error('Vertex AI not configured');
  }

  try {
    const modelName = process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash';
    
    console.log(`📝 Extracting ${numPoints} key points with Vertex AI...`);
    
    const model = vertexAI.getGenerativeModel({
      model: modelName,
    });

    const prompt = `Please extract exactly ${numPoints} key points from the following text. Each key point should be:
- A complete, concise sentence
- Capture an important idea or fact
- Be independent and self-contained

Format as a numbered list (1. 2. 3. etc.).

Text:
${text}

Key Points:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const keyPoints = response.candidates[0].content.parts[0].text.trim();

    console.log(`✅ Extracted key points`);
    
    return keyPoints;
  } catch (error) {
    console.error('Vertex AI key points extraction error:', error.message);
    throw error;
  }
}

module.exports = {
  initializeVertexAI,
  summarizeText,
  generateSummaryWithVertexAI,
  generateMultipleSummaries,
  extractKeyPoints,
  isConfigured: () => isConfigured,
};
