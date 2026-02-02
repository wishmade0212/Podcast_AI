/**
 * Google Cloud Storage Service
 * Handles file uploads, downloads, and management in GCS
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-credentials.json'
});

// Bucket names from environment
const DOCUMENTS_BUCKET = process.env.GCS_DOCUMENTS_BUCKET || 'podcast-documents-474105';
const AUDIO_BUCKET = process.env.GCS_AUDIO_BUCKET || 'podcast-audio-474105';

// Get bucket instances
const documentsBucket = storage.bucket(DOCUMENTS_BUCKET);
const audioBucket = storage.bucket(AUDIO_BUCKET);

/**
 * Upload file to Google Cloud Storage
 * @param {Buffer|string} fileContent - File content or local file path
 * @param {string} destination - Destination path in bucket (e.g., 'userId/filename.pdf')
 * @param {string} bucketType - 'documents' or 'audio'
 * @param {object} options - Additional options (contentType, metadata, etc.)
 * @returns {Promise<string>} - Public or signed URL of uploaded file
 */
async function uploadFile(fileContent, destination, bucketType = 'documents', options = {}) {
  try {
    const bucket = bucketType === 'audio' ? audioBucket : documentsBucket;
    const file = bucket.file(destination);

    // Determine if fileContent is a local path or buffer
    const isLocalPath = typeof fileContent === 'string' && !Buffer.isBuffer(fileContent);

    if (isLocalPath) {
      // Upload from local file
      await bucket.upload(fileContent, {
        destination: destination,
        metadata: {
          contentType: options.contentType || getContentType(destination),
          metadata: options.metadata || {}
        },
        ...options
      });
    } else {
      // Upload from buffer
      await file.save(fileContent, {
        metadata: {
          contentType: options.contentType || getContentType(destination),
          metadata: options.metadata || {}
        },
        ...options
      });
    }

    console.log(`✅ Uploaded ${destination} to ${bucket.name}`);

    // Return signed URL for private access
    return await getSignedUrl(destination, bucketType);
  } catch (error) {
    console.error(`❌ Upload failed for ${destination}:`, error.message);
    throw error;
  }
}

/**
 * Generate signed URL for private file access
 * @param {string} fileName - File path in bucket
 * @param {string} bucketType - 'documents' or 'audio'
 * @param {number} expirationMinutes - URL expiration in minutes (default: 60)
 * @returns {Promise<string>} - Signed URL
 */
async function getSignedUrl(fileName, bucketType = 'documents', expirationMinutes = 60) {
  try {
    const bucket = bucketType === 'audio' ? audioBucket : documentsBucket;
    const file = bucket.file(fileName);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000
    });

    return url;
  } catch (error) {
    console.error(`❌ Failed to generate signed URL for ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Download file from GCS
 * @param {string} fileName - File path in bucket
 * @param {string} bucketType - 'documents' or 'audio'
 * @param {string} localPath - Optional local path to save file
 * @returns {Promise<Buffer>} - File content as buffer
 */
async function downloadFile(fileName, bucketType = 'documents', localPath = null) {
  try {
    const bucket = bucketType === 'audio' ? audioBucket : documentsBucket;
    const file = bucket.file(fileName);

    if (localPath) {
      await file.download({ destination: localPath });
      console.log(`✅ Downloaded ${fileName} to ${localPath}`);
      return await fs.readFile(localPath);
    } else {
      const [contents] = await file.download();
      console.log(`✅ Downloaded ${fileName} to memory`);
      return contents;
    }
  } catch (error) {
    console.error(`❌ Download failed for ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Delete file from GCS
 * @param {string} fileName - File path in bucket
 * @param {string} bucketType - 'documents' or 'audio'
 * @returns {Promise<boolean>} - Success status
 */
async function deleteFile(fileName, bucketType = 'documents') {
  try {
    const bucket = bucketType === 'audio' ? audioBucket : documentsBucket;
    const file = bucket.file(fileName);

    await file.delete();
    console.log(`✅ Deleted ${fileName} from ${bucket.name}`);
    return true;
  } catch (error) {
    if (error.code === 404) {
      console.warn(`⚠️ File ${fileName} not found, already deleted`);
      return true;
    }
    console.error(`❌ Delete failed for ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Check if file exists in GCS
 * @param {string} fileName - File path in bucket
 * @param {string} bucketType - 'documents' or 'audio'
 * @returns {Promise<boolean>} - True if exists
 */
async function fileExists(fileName, bucketType = 'documents') {
  try {
    const bucket = bucketType === 'audio' ? audioBucket : documentsBucket;
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error(`❌ Error checking file existence:`, error.message);
    return false;
  }
}

/**
 * List files in bucket directory
 * @param {string} prefix - Directory prefix (e.g., 'userId/')
 * @param {string} bucketType - 'documents' or 'audio'
 * @returns {Promise<Array>} - Array of file objects
 */
async function listFiles(prefix = '', bucketType = 'documents') {
  try {
    const bucket = bucketType === 'audio' ? audioBucket : documentsBucket;
    const [files] = await bucket.getFiles({ prefix });
    
    return files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      created: file.metadata.timeCreated,
      updated: file.metadata.updated
    }));
  } catch (error) {
    console.error(`❌ Failed to list files:`, error.message);
    throw error;
  }
}

/**
 * Get file metadata
 * @param {string} fileName - File path in bucket
 * @param {string} bucketType - 'documents' or 'audio'
 * @returns {Promise<object>} - File metadata
 */
async function getFileMetadata(fileName, bucketType = 'documents') {
  try {
    const bucket = bucketType === 'audio' ? audioBucket : documentsBucket;
    const file = bucket.file(fileName);
    const [metadata] = await file.getMetadata();
    
    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      created: metadata.timeCreated,
      updated: metadata.updated,
      md5Hash: metadata.md5Hash,
      crc32c: metadata.crc32c
    };
  } catch (error) {
    console.error(`❌ Failed to get metadata:`, error.message);
    throw error;
  }
}

/**
 * Move file from local uploads to GCS
 * @param {string} localPath - Local file path
 * @param {string} destination - Destination in GCS
 * @param {string} bucketType - 'documents' or 'audio'
 * @param {boolean} deleteLocal - Delete local file after upload
 * @returns {Promise<string>} - Signed URL
 */
async function migrateLocalFile(localPath, destination, bucketType = 'documents', deleteLocal = false) {
  try {
    // Upload to GCS
    const url = await uploadFile(localPath, destination, bucketType);
    
    // Optionally delete local file
    if (deleteLocal) {
      await fs.unlink(localPath);
      console.log(`🗑️ Deleted local file: ${localPath}`);
    }
    
    return url;
  } catch (error) {
    console.error(`❌ Migration failed for ${localPath}:`, error.message);
    throw error;
  }
}

/**
 * Get content type from file extension
 * @param {string} fileName - File name or path
 * @returns {string} - MIME type
 */
function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Get public URL for file (if bucket is public)
 * @param {string} fileName - File path in bucket
 * @param {string} bucketType - 'documents' or 'audio'
 * @returns {string} - Public URL
 */
function getPublicUrl(fileName, bucketType = 'documents') {
  const bucketName = bucketType === 'audio' ? AUDIO_BUCKET : DOCUMENTS_BUCKET;
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

/**
 * Generate file path for GCS
 * @param {string} userId - User ID
 * @param {string} fileName - Original filename
 * @param {string} type - 'document' or 'audio'
 * @returns {string} - GCS file path
 */
function generateFilePath(userId, fileName, type = 'document') {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}-${sanitized}`;
}

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  fileExists,
  listFiles,
  getFileMetadata,
  getSignedUrl,
  migrateLocalFile,
  getContentType,
  getPublicUrl,
  generateFilePath,
  storage,
  documentsBucket,
  audioBucket
};
