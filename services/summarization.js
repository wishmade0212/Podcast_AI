// Summarization service with Google Vertex AI and fallback to extractive summarization
const { summarizeText: summarizeWithVertexAI, isConfigured: isVertexAIConfigured } = require('./vertexAI');

// Simple extractive summarization algorithm (fallback)
const extractiveSummarization = async (text) => {
  try {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    if (sentences.length <= 3) {
      return text; // Return original text if it's already short
    }
    
    // Calculate word frequency
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = {};
    
    words.forEach(word => {
      if (word.length > 3) { // Ignore short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Score sentences based on word frequency
    const sentenceScores = sentences.map(sentence => {
      const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
      let score = 0;
      
      sentenceWords.forEach(word => {
        if (word.length > 3 && wordFreq[word]) {
          score += wordFreq[word];
        }
      });
      
      // Normalize score by sentence length
      return {
        sentence,
        score: sentenceWords.length > 0 ? score / sentenceWords.length : 0
      };
    });
    
    // Sort sentences by score (descending)
    sentenceScores.sort((a, b) => b.score - a.score);
    
    // Select top sentences (up to 30% of original or max 7 sentences)
    const summaryLength = Math.min(Math.ceil(sentences.length * 0.3), 7);
    const topSentences = sentenceScores.slice(0, summaryLength);
    
    // Sort selected sentences by their original order
    const orderedSentences = topSentences.map(item => item.sentence);
    const originalOrderSentences = [];
    
    sentences.forEach(sentence => {
      if (orderedSentences.includes(sentence)) {
        originalOrderSentences.push(sentence);
      }
    });
    
    // Join sentences to form summary
    const summary = originalOrderSentences.join(' ');
    
    return summary;
  } catch (error) {
    console.error('Error in extractive summarization:', error);
    throw new Error(`Failed to summarize text: ${error.message}`);
  }
};

// Main summarization function with AI and fallback
const summarizeText = async (text, options = {}) => {
  try {
    // Try Google Vertex AI first if configured
    if (isVertexAIConfigured()) {
      try {
        console.log('🤖 Attempting summarization with Google Vertex AI...');
        const summary = await summarizeWithVertexAI(text, options);
        
        if (summary && summary.trim().length > 0) {
          console.log('✅ Successfully generated summary using Vertex AI');
          return summary;
        }
      } catch (vertexError) {
        console.log('⚠️  Vertex AI summarization failed, falling back to extractive method');
        console.log('   Error:', vertexError.message);
      }
    }

    // Fallback to extractive summarization
    console.log('📝 Using extractive summarization (fallback)...');
    const summary = await extractiveSummarization(text);
    console.log('✅ Generated summary using extractive method');
    return summary;
    
  } catch (error) {
    console.error('Error in summarization:', error);
    throw new Error(`Failed to summarize text: ${error.message}`);
  }
};

module.exports = summarizeText;