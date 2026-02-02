const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { extractTextWithDocumentAI, getMimeType, isConfigured } = require('./googleDocumentAI');

/**
 * Extract text from uploaded file using Google Document AI (if configured) 
 * or fallback to local libraries
 */
const extractText = async (file, fileType) => {
  try {
    let text = '';

    // Try Google Document AI first if configured
    if (isConfigured()) {
      try {
        console.log('Attempting extraction with Google Document AI...');
        const mimeType = getMimeType(fileType);
        text = await extractTextWithDocumentAI(file.buffer, mimeType);
        
        // If successful, return the text
        if (text && text.trim().length > 0) {
          console.log('✅ Successfully extracted text using Google Document AI');
          return text;
        }
      } catch (googleError) {
        console.log('⚠️  Google Document AI failed, falling back to local extraction');
        console.log('   Error:', googleError.message);
      }
    }

    // Fallback to local extraction methods
    console.log('Using local text extraction...');
    switch (fileType) {
      case 'pdf':
        const pdfData = await pdf(file.buffer);
        text = pdfData.text;
        console.log(`✅ Extracted ${text.length} characters from PDF using pdf-parse`);
        break;
      case 'docx':
        const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
        text = docxResult.value;
        console.log(`✅ Extracted ${text.length} characters from DOCX using mammoth`);
        break;
      case 'txt':
        text = file.buffer.toString('utf8');
        console.log(`✅ Extracted ${text.length} characters from TXT`);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text from ${fileType} file: ${error.message}`);
  }
};

module.exports = extractText;