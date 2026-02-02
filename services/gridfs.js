const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const stream = require('stream');

let gfsBucket;

/**
 * Initialize GridFS bucket
 */
function initGridFS() {
    if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        gfsBucket = new GridFSBucket(db, {
            bucketName: 'uploads'
        });
        console.log('✅ GridFS initialized successfully');
        return gfsBucket;
    } else {
        console.error('❌ MongoDB not connected. Cannot initialize GridFS.');
        return null;
    }
}

/**
 * Get GridFS bucket instance
 */
function getGridFSBucket() {
    if (!gfsBucket) {
        return initGridFS();
    }
    return gfsBucket;
}

/**
 * Upload file to GridFS from buffer
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} filename - Name of the file
 * @param {object} metadata - Additional metadata (optional)
 * @returns {Promise<object>} Upload result with file ID and details
 */
async function uploadToGridFS(fileBuffer, filename, metadata = {}) {
    try {
        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS not initialized');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(filename, {
                metadata: {
                    ...metadata,
                    uploadDate: new Date()
                }
            });

            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);

            bufferStream.pipe(uploadStream)
                .on('error', (error) => {
                    console.error('❌ GridFS upload error:', error);
                    reject(error);
                })
                .on('finish', () => {
                    console.log(`✅ File uploaded to GridFS: ${filename}`);
                    console.log(`   File ID: ${uploadStream.id}`);
                    console.log(`   Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
                    
                    resolve({
                        fileId: uploadStream.id,
                        filename: filename,
                        size: fileBuffer.length,
                        contentType: metadata.contentType || 'application/octet-stream',
                        uploadDate: new Date(),
                        metadata: metadata
                    });
                });
        });
    } catch (error) {
        console.error('❌ Error uploading to GridFS:', error);
        throw error;
    }
}

/**
 * Upload file from local path to GridFS
 * @param {string} filePath - Path to the file
 * @param {string} filename - Name for the file in GridFS
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Upload result
 */
async function uploadFileToGridFS(filePath, filename, metadata = {}) {
    try {
        const fs = require('fs').promises;
        const fileBuffer = await fs.readFile(filePath);
        return await uploadToGridFS(fileBuffer, filename, metadata);
    } catch (error) {
        console.error('❌ Error uploading file to GridFS:', error);
        throw error;
    }
}

/**
 * Download file from GridFS as buffer
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Buffer>} File content as buffer
 */
async function downloadFromGridFS(fileId) {
    try {
        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS not initialized');
        }

        const ObjectId = mongoose.Types.ObjectId;
        const _id = new ObjectId(fileId);

        return new Promise((resolve, reject) => {
            const chunks = [];
            const downloadStream = bucket.openDownloadStream(_id);

            downloadStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            downloadStream.on('error', (error) => {
                console.error('❌ GridFS download error:', error);
                reject(error);
            });

            downloadStream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log(`✅ File downloaded from GridFS: ${fileId}`);
                console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
                resolve(buffer);
            });
        });
    } catch (error) {
        console.error('❌ Error downloading from GridFS:', error);
        throw error;
    }
}

/**
 * Get download stream for a file
 * @param {string} fileId - GridFS file ID
 * @returns {ReadStream} Download stream
 */
function getDownloadStream(fileId) {
    try {
        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS not initialized');
        }

        const ObjectId = mongoose.Types.ObjectId;
        const _id = new ObjectId(fileId);

        return bucket.openDownloadStream(_id);
    } catch (error) {
        console.error('❌ Error creating download stream:', error);
        throw error;
    }
}

/**
 * Get file metadata from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<object>} File metadata
 */
async function getFileMetadata(fileId) {
    try {
        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS not initialized');
        }

        const ObjectId = mongoose.Types.ObjectId;
        const _id = new ObjectId(fileId);

        const files = await bucket.find({ _id }).toArray();
        
        if (files.length === 0) {
            throw new Error('File not found in GridFS');
        }

        const file = files[0];
        console.log(`✅ File metadata retrieved: ${file.filename}`);
        
        return {
            fileId: file._id.toString(),
            filename: file.filename,
            size: file.length,
            uploadDate: file.uploadDate,
            contentType: file.metadata?.contentType || 'application/octet-stream',
            metadata: file.metadata
        };
    } catch (error) {
        console.error('❌ Error getting file metadata:', error);
        throw error;
    }
}

/**
 * Delete file from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
async function deleteFromGridFS(fileId) {
    try {
        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS not initialized');
        }

        const ObjectId = mongoose.Types.ObjectId;
        const _id = new ObjectId(fileId);

        await bucket.delete(_id);
        console.log(`✅ File deleted from GridFS: ${fileId}`);
    } catch (error) {
        console.error('❌ Error deleting from GridFS:', error);
        throw error;
    }
}

/**
 * List all files in GridFS with optional filter
 * @param {object} filter - MongoDB filter query
 * @param {number} limit - Maximum number of files to return
 * @returns {Promise<Array>} Array of file metadata
 */
async function listFiles(filter = {}, limit = 100) {
    try {
        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS not initialized');
        }

        const files = await bucket.find(filter).limit(limit).toArray();
        
        console.log(`✅ Found ${files.length} files in GridFS`);
        
        return files.map(file => ({
            fileId: file._id.toString(),
            filename: file.filename,
            size: file.length,
            uploadDate: file.uploadDate,
            contentType: file.metadata?.contentType || 'application/octet-stream',
            metadata: file.metadata
        }));
    } catch (error) {
        console.error('❌ Error listing GridFS files:', error);
        throw error;
    }
}

/**
 * Delete old files from GridFS (cleanup)
 * @param {number} daysOld - Delete files older than this many days
 * @returns {Promise<number>} Number of files deleted
 */
async function deleteOldFiles(daysOld = 30) {
    try {
        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS not initialized');
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const oldFiles = await bucket.find({
            uploadDate: { $lt: cutoffDate }
        }).toArray();

        let deletedCount = 0;
        for (const file of oldFiles) {
            await bucket.delete(file._id);
            deletedCount++;
        }

        console.log(`✅ Deleted ${deletedCount} old files from GridFS (older than ${daysOld} days)`);
        return deletedCount;
    } catch (error) {
        console.error('❌ Error deleting old files:', error);
        throw error;
    }
}

/**
 * Check if file exists in GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(fileId) {
    try {
        const bucket = getGridFSBucket();
        if (!bucket) {
            return false;
        }

        const ObjectId = mongoose.Types.ObjectId;
        const _id = new ObjectId(fileId);

        const files = await bucket.find({ _id }).limit(1).toArray();
        return files.length > 0;
    } catch (error) {
        console.error('❌ Error checking file existence:', error);
        return false;
    }
}

module.exports = {
    initGridFS,
    getGridFSBucket,
    uploadToGridFS,
    uploadFileToGridFS,
    downloadFromGridFS,
    getDownloadStream,
    getFileMetadata,
    deleteFromGridFS,
    listFiles,
    deleteOldFiles,
    fileExists
};
