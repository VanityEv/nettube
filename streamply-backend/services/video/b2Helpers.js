// Backblaze B2 helpers for upload and signed URL generation
// NOTE: You must set B2 credentials in environment variables or config

import B2 from 'backblaze-b2';
import { v4 as uuidv4 } from 'uuid';

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

const B2_BUCKET_ID = process.env.B2_BUCKET_ID;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;

// --- ENVIRONMENT VARIABLE VALIDATION (DEVELOPMENT MODE SUPPORT) ---
const isDevelopment = process.env.NODE_ENV === 'development';

if (!isDevelopment) {
  // Only enforce B2 credentials in production
  if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_BUCKET_ID || !process.env.B2_BUCKET_NAME) {
    throw new Error('Missing Backblaze B2 credentials in environment variables!');
  }
} else {
  console.log('⚠️  Development mode: B2 operations will be simulated');
}

// Authenticate B2 session
async function authorizeB2() {
  if (isDevelopment) {
    console.log('🔄 Development mode: Simulating B2 authorization');
    return;
  }
  
  if (!b2.authorizationToken) {
    await b2.authorize();
  }
}

// Upload a buffer to B2, returns file URL
export async function uploadToB2(buffer, fileName, mimeType) {
  if (isDevelopment) {
    console.log(`🔄 Development mode: Simulating B2 upload for ${fileName}`);
    return `https://demo-b2-bucket.backblazeb2.com/file/${B2_BUCKET_NAME}/${fileName}`;
  }
  
  await authorizeB2();
  const uploadUrlResp = await b2.getUploadUrl({ bucketId: B2_BUCKET_ID });
  const uploadResp = await b2.uploadFile({
    uploadUrl: uploadUrlResp.data.uploadUrl,
    uploadAuthToken: uploadUrlResp.data.authorizationToken,
    fileName,
    data: buffer,
    mime: mimeType,
  });
  return `https://f000.backblazeb2.com/file/${B2_BUCKET_NAME}/${fileName}`;
}

// --- PRODUCTION-GRADE B2 SIGNED URL IMPLEMENTATION ---
// This version uses b2_get_download_authorization for secure, expiring URLs (bucket must be private)

/**
 * Generate a signed B2 download URL (valid for expiresInSeconds)
 * @param {string} fileName - The file name in the B2 bucket
 * @param {number} expiresInSeconds - How long the URL is valid (default: 1 hour)
 * @returns {Promise<string>} - Signed download URL
 */
export async function generateB2SignedUrl(fileName, expiresInSeconds = 3600) {
  if (isDevelopment) {
    console.log(`🔄 Development mode: Simulating signed URL for ${fileName}`);
    return `https://demo-b2-bucket.backblazeb2.com/file/${B2_BUCKET_NAME}/${fileName}?auth=demo_token`;
  }
  
  await authorizeB2();
  // Remove leading slash if present
  const cleanFileName = fileName.startsWith('/') ? fileName.slice(1) : fileName;
  const authResp = await b2.getDownloadAuthorization({
    bucketId: B2_BUCKET_ID,
    fileNamePrefix: cleanFileName,
    validDurationInSeconds: expiresInSeconds,
  });
  // Construct signed URL
  const baseUrl = `https://f000.backblazeb2.com/file/${B2_BUCKET_NAME}/${cleanFileName}`;
  return `${baseUrl}?Authorization=${authResp.data.authorizationToken}`;
}

// Download a file from B2, returns buffer
export async function downloadFromB2(fileName) {
  if (isDevelopment) {
    console.log(`🔄 Development mode: Simulating B2 download for ${fileName}`);
    return Buffer.from('simulated file content');
  }
  
  try {
    await authorizeB2();
    
    const fileInfo = await b2.getFileInfo({ fileName });
    const downloadResp = await b2.downloadFileByName({
      bucketName: B2_BUCKET_NAME,
      fileName: fileName
    });
    
    return downloadResp.data;
  } catch (error) {
    console.error('B2 download error:', error);
    throw new Error(`Failed to download file from B2: ${fileName}`);
  }
}

// Delete a file from B2
export async function deleteFromB2(fileName) {
  if (isDevelopment) {
    console.log(`🔄 Development mode: Simulating B2 delete for ${fileName}`);
    return true;
  }
  
  try {
    await authorizeB2();
    
    // First get file info to get fileId
    const fileList = await b2.listFileNames({
      bucketId: B2_BUCKET_ID,
      prefix: fileName,
      maxFileCount: 1
    });
    
    if (fileList.data.files.length === 0) {
      console.warn(`File not found for deletion: ${fileName}`);
      return false;
    }
    
    const file = fileList.data.files[0];
    await b2.deleteFileVersion({
      fileId: file.fileId,
      fileName: file.fileName
    });
    
    console.log(`Successfully deleted from B2: ${fileName}`);
    return true;
  } catch (error) {
    console.error('B2 delete error:', error);
    throw new Error(`Failed to delete file from B2: ${fileName}`);
  }
}

// Delete multiple files from B2 (batch operation)
export async function deleteMultipleFromB2(fileNames) {
  const deletePromises = fileNames.map(fileName => deleteFromB2(fileName));
  const results = await Promise.allSettled(deletePromises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`B2 batch delete: ${successful} successful, ${failed} failed`);
  return { successful, failed, results };
}

// Upload multiple files to B2 (batch operation)
export async function uploadMultipleToB2(files) {
  const uploadPromises = files.map(file => 
    uploadToB2(file.buffer, file.fileName, file.mimeType)
  );
  
  const results = await Promise.allSettled(uploadPromises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`B2 batch upload: ${successful} successful, ${failed} failed`);
  return { successful, failed, results };
}

// List files in B2 with prefix (for cleanup operations)
export async function listB2Files(prefix, maxCount = 1000) {
  try {
    await authorizeB2();
    
    const fileList = await b2.listFileNames({
      bucketId: B2_BUCKET_ID,
      prefix: prefix,
      maxFileCount: maxCount
    });
    
    return fileList.data.files;
  } catch (error) {
    console.error('B2 list files error:', error);
    throw new Error(`Failed to list B2 files with prefix: ${prefix}`);
  }
}

// Check if file exists in B2
export async function fileExistsInB2(fileName) {
  try {
    const files = await listB2Files(fileName, 1);
    return files.some(file => file.fileName === fileName);
  } catch (error) {
    console.error('B2 file existence check error:', error);
    return false;
  }
}

// Get B2 file info and metadata
export async function getB2FileInfo(fileName) {
  try {
    await authorizeB2();
    
    const fileList = await b2.listFileNames({
      bucketId: B2_BUCKET_ID,
      prefix: fileName,
      maxFileCount: 1
    });
    
    if (fileList.data.files.length === 0) {
      return null;
    }
    
    return fileList.data.files[0];
  } catch (error) {
    console.error('B2 file info error:', error);
    throw new Error(`Failed to get B2 file info: ${fileName}`);
  }
}

// Clean up orphaned video files (for maintenance)
export async function cleanupOrphanedVideos(olderThanDays = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // List all video files
    const videoFiles = await listB2Files('temp-uploads/', 10000);
    
    const orphanedFiles = videoFiles.filter(file => {
      const uploadDate = new Date(file.uploadTimestamp);
      return uploadDate < cutoffDate;
    });
    
    if (orphanedFiles.length === 0) {
      console.log('No orphaned video files found');
      return { cleaned: 0, total: videoFiles.length };
    }
    
    console.log(`Found ${orphanedFiles.length} orphaned video files to clean up`);
    
    const fileNames = orphanedFiles.map(file => file.fileName);
    const result = await deleteMultipleFromB2(fileNames);
    
    return {
      cleaned: result.successful,
      failed: result.failed,
      total: videoFiles.length
    };
    
  } catch (error) {
    console.error('B2 cleanup error:', error);
    throw new Error('Failed to cleanup orphaned videos');
  }
}
