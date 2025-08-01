// Backblaze B2 helpers for upload and signed URL generation
// NOTE: You must set B2 credentials in environment variables or config

import B2 from 'backblaze-b2';
import { v4 as uuidv4 } from 'uuid';

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID || process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

const B2_BUCKET_ID = process.env.B2_BUCKET_ID;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;

// --- ENVIRONMENT VARIABLE VALIDATION (DEVELOPMENT MODE SUPPORT) ---
function checkEnvironment() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const keyId = process.env.B2_APPLICATION_KEY_ID || process.env.B2_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;
  const bucketId = process.env.B2_BUCKET_ID;
  const bucketName = process.env.B2_BUCKET_NAME;
  
  // Check if credentials exist and look valid (not placeholder values)
  const hasValidCredentials = !!(
    keyId && 
    appKey && 
    bucketId && 
    bucketName &&
    keyId.length > 20 && // Real B2 key IDs are longer
    appKey.length > 20 && // Real B2 application keys are longer
    !keyId.includes('your_') && // Not a placeholder
    !appKey.includes('your_') && // Not a placeholder
    !bucketId.includes('your_') // Not a placeholder
  );
  
  if (!isDevelopment && !hasValidCredentials) {
    throw new Error('Missing or invalid Backblaze B2 credentials in environment variables!');
  }
  
  if (isDevelopment && !hasValidCredentials) {
    console.log('⚠️  Development mode: B2 operations will be simulated (invalid/missing credentials)');
  }
  
  return { isDevelopment, hasB2Credentials: hasValidCredentials };
}

// Lazy evaluation of environment
function getEnvironmentInfo() {
  return checkEnvironment();
}

// Authenticate B2 session
async function authorizeB2() {
  const { hasB2Credentials } = getEnvironmentInfo();
  
  if (!hasB2Credentials) {
    console.log('🔄 Development mode: Simulating B2 authorization');
    return;
  }
  
  if (!b2.authorizationToken) {
    await b2.authorize();
  }
}

// Upload a buffer to B2, returns file URL
export async function uploadToB2(buffer, fileName, mimeType) {
  const { hasB2Credentials } = getEnvironmentInfo();
  
  if (!hasB2Credentials) {
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
  
  // For private buckets, return the S3-compatible URL format
  // Extract the correct endpoint from the upload URL
  const uploadUrl = new URL(uploadUrlResp.data.uploadUrl);
  const endpoint = uploadUrl.hostname;
  
  // Return S3-compatible URL format for private buckets
  return `https://${B2_BUCKET_NAME}.${endpoint}/${fileName}`;
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
  const { hasB2Credentials } = getEnvironmentInfo();
  
  if (!hasB2Credentials) {
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
  
  // For private buckets, use the standard B2 download URL format
  // The downloadUrl from the authorization response is the correct endpoint to use
  const downloadUrl = authResp.data.downloadUrl || 'https://f003.backblazeb2.com';
  
  // Use the standard B2 file download format with authorization token
  return `${downloadUrl}/file/${B2_BUCKET_NAME}/${cleanFileName}?Authorization=${authResp.data.authorizationToken}`;
}

/**
 * Extract B2 file path from a signed or unsigned B2 URL
 * @param {string} b2Url - The B2 URL (signed or unsigned)
 * @returns {string} - The file path within the bucket
 */
export function extractB2FilePath(b2Url) {
  try {
    // Handle multiple B2 URL formats:
    // 1. Old format: https://f000.backblazeb2.com/file/streamply-bucket-prod/thumbnails/video.jpg
    // 2. S3 format: https://streamply-bucket-prod.s3.eu-central-003.backblazeb2.com/thumbnails/video.jpg
    // 3. Pod format: https://streamply-bucket-prod.pod-031-2026-17.backblaze.com/avatars/file.jpg
    
    const url = new URL(b2Url);
    const hostname = url.hostname;
    
    // Check if it's the S3-compatible format (bucket-name.s3.region.backblazeb2.com)
    if (hostname.startsWith(`${B2_BUCKET_NAME}.s3.`)) {
      // For S3 format, the file path is just the pathname (remove leading slash)
      return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    } 
    // Check if it's the pod format (bucket-name.pod-xxx.backblaze.com)
    else if (hostname.startsWith(`${B2_BUCKET_NAME}.pod-`) && hostname.includes('.backblaze.com')) {
      // For pod format, the file path is just the pathname (remove leading slash)
      return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    } 
    else {
      // Handle old format: f000.backblazeb2.com/file/bucket-name/file-path
      const pathParts = url.pathname.split('/');
      
      // Find the bucket name and get everything after it
      const bucketIndex = pathParts.findIndex(part => part === B2_BUCKET_NAME);
      if (bucketIndex === -1) {
        throw new Error('Bucket name not found in URL');
      }
      
      // Get the file path (everything after the bucket name)
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    
  } catch (error) {
    console.error('Error extracting B2 file path:', error);
    throw new Error(`Invalid B2 URL: ${b2Url}`);
  }
}

/**
 * Generate a fresh signed URL from an existing B2 URL (even if expired)
 * @param {string} existingB2Url - The existing B2 URL (can be expired)
 * @param {number} expiresInSeconds - How long the new URL should be valid
 * @returns {Promise<string>} - Fresh signed URL
 */
export async function refreshB2SignedUrl(existingB2Url, expiresInSeconds = 3600) {
  const { hasB2Credentials } = getEnvironmentInfo();
  
  if (!hasB2Credentials) {
    console.log(`🔄 Development mode: Simulating URL refresh for ${existingB2Url}`);
    return existingB2Url;
  }
  
  try {
    // Extract the file path from the existing URL
    const filePath = extractB2FilePath(existingB2Url);
    
    // Generate a fresh signed URL
    return await generateB2SignedUrl(filePath, expiresInSeconds);
    
  } catch (error) {
    console.error('Error refreshing B2 signed URL:', error);
    throw new Error(`Failed to refresh signed URL: ${error.message}`);
  }
}

// Download a file from B2, returns buffer
export async function downloadFromB2(fileName) {
  const { hasB2Credentials } = getEnvironmentInfo();
  
  if (!hasB2Credentials) {
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
  const { hasB2Credentials } = getEnvironmentInfo();
  
  if (!hasB2Credentials) {
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
      // Don't log this as a warning since many files might not exist during bulk deletion
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
  console.log(`Starting batch deletion of ${fileNames.length} files from B2...`);
  
  const deletePromises = fileNames.map(async (fileName) => {
    try {
      const result = await deleteFromB2(fileName);
      return { status: 'fulfilled', fileName, result };
    } catch (error) {
      return { status: 'rejected', fileName, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(deletePromises);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.result === true).length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.result === false)).length;
  const notFound = results.filter(r => r.status === 'fulfilled' && r.value.result === false).length;
  
  console.log(`B2 batch delete: ${successful} successful, ${failed} failed (${notFound} not found)`);
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
  const { hasB2Credentials } = getEnvironmentInfo();
  
  if (!hasB2Credentials) {
    console.log(`🔄 Development mode: Cannot list B2 files for prefix ${prefix}`);
    return [];
  }

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
    // Return empty array instead of throwing to allow deletion to continue
    console.log('Falling back to pattern-based deletion');
    return [];
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
