/**
 * Complete Video Processing Servic    // Check if input is file path or buffer
    if (typeof videoInput === 'string') {
      // File path - copy from uploaded location to temp processing directory
      console.log(`[${processingId}] Copying from ${videoInput} to ${originalVideoPath}`);
      await fs.copyFile(videoInput, originalVideoPath);
      await fs.copyFile(thumbnailInput, originalThumbnailPath);
      
      // Handle cinematic thumbnail if provided
      if (cinematicThumbnailInput) {
        await fs.copyFile(cinematicThumbnailInput, originalCinematicPath);
        await fs.unlink(cinematicThumbnailInput);
      }
      
      // Clean up uploaded files immediately after copying
      await fs.unlink(videoInput);
      await fs.unlink(thumbnailInput);
    } else {
      // Buffer - write directly to temp directory
      console.log(`[${processingId}] Writing buffer to ${originalVideoPath}`);
      await fs.writeFile(originalVideoPath, videoInput);
      await fs.writeFile(originalThumbnailPath, thumbnailInput);
      
      // Handle cinematic thumbnail if provided
      if (cinematicThumbnailInput) {
        await fs.writeFile(originalCinematicPath, cinematicThumbnailInput);
      }
    }ackblaze B2
 * Handles: MP4/MKV upload → HLS transcoding → B2 storage → cleanup
 */

import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { toKebabCase } from '../../helpers/toKebabCase.js';
import { getVideoMetadata, convertToHLS, generateThumbnail, compressImage } from './ffmpegUtils.js';
import { uploadToB2, downloadFromB2, deleteFromB2, generateB2SignedUrl } from './b2Helpers.js';
import { logSecurityEvent } from '../security/mongoLogger.js';

/**
 * Complete video processing pipeline for movies (Heroku-compatible)
 * Can accept either file paths (from disk storage) or buffers (from memory storage)
 */
export async function processMovieUpload(videoInput, thumbnailInput, cinematicThumbnailInput, movieData, userId) {
  const processingId = uuidv4();
  // Use OS temp directory for cross-platform compatibility
  const tempDir = path.join(os.tmpdir(), `video-processing-${processingId}`);
  
  try {
    console.log(`[${processingId}] Starting movie processing for: ${movieData.title}`);
    
    // 1. Create temporary directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // 2. Handle input files (path or buffer) and compress thumbnail
    const originalVideoPath = path.join(tempDir, 'input.mp4');
    const originalThumbnailPath = path.join(tempDir, 'original-thumbnail.jpg');
    const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
    const originalCinematicPath = path.join(tempDir, 'original-cinematic.jpg');
    const cinematicPath = path.join(tempDir, 'cinematic.jpg');
    
    console.log(`[${processingId}] Video input type: ${typeof videoInput}`);
    console.log(`[${processingId}] Video input value:`, videoInput);
    console.log(`[${processingId}] Original video path: ${originalVideoPath}`);
    
    // Check if input is file path or buffer
    if (typeof videoInput === 'string') {
      // File path - copy from uploaded location to temp processing directory
      console.log(`[${processingId}] Copying from ${videoInput} to ${originalVideoPath}`);
      await fs.copyFile(videoInput, originalVideoPath);
      await fs.copyFile(thumbnailInput, originalThumbnailPath);
      
      // Copy cinematic thumbnail if provided
      if (cinematicThumbnailInput) {
        console.log(`[${processingId}] Copying cinematic thumbnail from ${cinematicThumbnailInput} to ${originalCinematicPath}`);
        await fs.copyFile(cinematicThumbnailInput, originalCinematicPath);
      }
      
      // Clean up uploaded files immediately after copying
      await fs.unlink(videoInput);
      await fs.unlink(thumbnailInput);
      if (cinematicThumbnailInput) {
        await fs.unlink(cinematicThumbnailInput);
      }
    } else {
      // Buffer - write directly to temp directory
      console.log(`[${processingId}] Writing buffer to ${originalVideoPath}`);
      await fs.writeFile(originalVideoPath, videoInput);
      await fs.writeFile(originalThumbnailPath, thumbnailInput);
      
      // Write cinematic thumbnail if provided
      if (cinematicThumbnailInput) {
        console.log(`[${processingId}] Writing cinematic thumbnail buffer to ${originalCinematicPath}`);
        await fs.writeFile(originalCinematicPath, cinematicThumbnailInput);
      }
    }
    
    // Compress the user-uploaded thumbnail
    console.log(`[${processingId}] Compressing main thumbnail...`);
    await compressImage(originalThumbnailPath, thumbnailPath, {
      width: 800,     // Compress to 800px width (much smaller than 2MB)
      quality: 80     // 80% quality for main poster
    });
    
    // Compress cinematic thumbnail if provided
    let cinematicThumbnailUrl = null;
    if (cinematicThumbnailInput) {
      console.log(`[${processingId}] Compressing cinematic thumbnail...`);
      await compressImage(originalCinematicPath, cinematicPath, {
        width: 1920,    // 16:9 cinematic format - wider
        quality: 80     // 80% quality for cinematic thumbnail
      });
    }
    
    // 3. Get video metadata
    console.log(`[${processingId}] Analyzing video metadata...`);
    console.log(`[${processingId}] Calling getVideoMetadata with: ${originalVideoPath} (type: ${typeof originalVideoPath})`);
    const videoInfo = await getVideoMetadata(originalVideoPath);
    const videoDuration = Math.round(videoInfo.duration / 60); // Convert to minutes
    
    // 4. Generate video-specific paths
    const kebabTitle = toKebabCase(movieData.title);
    const videoId = uuidv4();
    const hlsDir = path.join(tempDir, 'hls');
    const playlistPath = path.join(hlsDir, 'playlist.m3u8');
      // 5. Transcode to HLS
    console.log(`[${processingId}] Transcoding to HLS format...`);
    await fs.mkdir(hlsDir, { recursive: true });
    
    await convertToHLS(originalVideoPath, hlsDir, {
      resolution: '1920x1080',
      bitrate: '4000k',
      segmentDuration: 6,
      hlsPlaylistType: 'vod'
    });
    
    // 6. Generate additional thumbnails/previews
    console.log(`[${processingId}] Generating thumbnails...`);
    const previewDir = path.join(tempDir, 'previews');
    await fs.mkdir(previewDir, { recursive: true });
    
    // Generate multiple thumbnails at different timestamps (reduced to 5 for performance)
    const thumbnails = [];
    const videoDurationSeconds = Math.floor(videoInfo.format.duration);
    
    for (let i = 0; i < 3; i++) { // Reduced to 3 previews for better performance
      // Generate timestamps evenly distributed across video duration
      const timestampSeconds = Math.floor((videoDurationSeconds / 6) * (i + 1)); // Skip first/last second
      const minutes = Math.floor(timestampSeconds / 60);
      const seconds = timestampSeconds % 60;
      const timestamp = `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      const thumbPath = path.join(previewDir, `thumb-${i}.jpg`);
      await generateThumbnail(originalVideoPath, thumbPath, timestamp, {
        width: 320,  // Compress to 320px width (from 1920px)
        quality: 75  // Reduce JPEG quality to 75% (from 100%)
      });
      thumbnails.push(thumbPath);
    }
    
    // 7. Upload HLS files to B2 with retry logic
    console.log(`[${processingId}] Uploading HLS segments to B2...`);
    const b2VideoFolder = `movies/${kebabTitle}-${videoId}`;
    const hlsFiles = await fs.readdir(hlsDir);
    const uploadPromises = [];
    
    // Helper function to upload with retry
    const uploadWithRetry = async (buffer, fileName, mimeType, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await uploadToB2(buffer, fileName, mimeType);
        } catch (error) {
          if (error.response?.status === 503 && attempt < maxRetries) {
            console.log(`[${processingId}] B2 503 error, retrying upload ${attempt}/${maxRetries} for ${fileName}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            continue;
          }
          throw error;
        }
      }
    };
    
    // Upload main playlist
    const playlistBuffer = await fs.readFile(playlistPath);
    uploadPromises.push(
      uploadWithRetry(playlistBuffer, `${b2VideoFolder}/playlist.m3u8`, 'application/x-mpegURL')
    );
    
    // Upload segments from quality subdirectories
    for (const file of hlsFiles) {
      const filePath = path.join(hlsDir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        // This is a quality directory (480p, 720p, etc.)
        const qualityFiles = await fs.readdir(filePath);
        for (const qualityFile of qualityFiles) {
          if (qualityFile.endsWith('.ts')) {
            const segmentBuffer = await fs.readFile(path.join(filePath, qualityFile));
            uploadPromises.push(
              uploadWithRetry(segmentBuffer, `${b2VideoFolder}/${file}/${qualityFile}`, 'video/MP2T')
            );
          }
        }
      } else if (file.endsWith('.ts')) {
        // Direct .ts file in root hls directory (fallback)
        const segmentBuffer = await fs.readFile(path.join(hlsDir, file));
        uploadPromises.push(
          uploadWithRetry(segmentBuffer, `${b2VideoFolder}/${file}`, 'video/MP2T')
        );
      } else if (file.endsWith('.m3u8') && file !== 'playlist.m3u8') {
        // Upload quality-specific playlist files (720p.m3u8, 480p.m3u8, etc.)
        const qualityPlaylistBuffer = await fs.readFile(path.join(hlsDir, file));
        uploadPromises.push(
          uploadWithRetry(qualityPlaylistBuffer, `${b2VideoFolder}/${file}`, 'application/x-mpegURL')
        );
      }
    }
    
    // Upload thumbnail (compressed)
    const thumbnailBuffer = await fs.readFile(thumbnailPath);
    uploadPromises.push(
      uploadWithRetry(thumbnailBuffer, `thumbnails/${kebabTitle}-${videoId}.jpg`, 'image/jpeg')
    );
    
    // Upload cinematic thumbnail if provided (compressed)
    if (cinematicThumbnailInput) {
      const cinematicBuffer = await fs.readFile(cinematicPath);
      uploadPromises.push(
        uploadWithRetry(cinematicBuffer, `cinematic-thumbnails/${kebabTitle}-${videoId}.jpg`, 'image/jpeg')
      );
    }
    
    // Upload preview thumbnails (compressed)
    for (let i = 0; i < thumbnails.length; i++) {
      const thumbBuffer = await fs.readFile(thumbnails[i]);
      uploadPromises.push(
        uploadWithRetry(thumbBuffer, `previews/${kebabTitle}-${videoId}/thumb-${i}.jpg`, 'image/jpeg')
      );
    }
    
    await Promise.all(uploadPromises);
    
    // 8. Store B2 file paths (not signed URLs) for on-demand URL generation
    const playlistB2Path = `${b2VideoFolder}/playlist.m3u8`;
    const thumbnailB2Path = `thumbnails/${kebabTitle}-${videoId}.jpg`;
    const cinematicB2Path = cinematicThumbnailInput ? `cinematic-thumbnails/${kebabTitle}-${videoId}.jpg` : null;
    
    // For now, generate signed URLs for immediate use, but we'll move to on-demand generation
    const playlistUrl = await generateB2SignedUrl(playlistB2Path, 7 * 24 * 60 * 60); // 1 week (B2 max)
    const thumbnailUrl = await generateB2SignedUrl(thumbnailB2Path, 7 * 24 * 60 * 60);
    if (cinematicB2Path) {
      cinematicThumbnailUrl = await generateB2SignedUrl(cinematicB2Path, 7 * 24 * 60 * 60);
    }
    
    // 9. Log success
    await logSecurityEvent({
      type: 'video_processing_success',
      userId,
      data: {
        processingId,
        videoTitle: movieData.title,
        duration: videoDuration,
        hlsSegments: hlsFiles.filter(f => f.endsWith('.ts')).length,
        thumbnails: thumbnails.length
      }
    });
    
    console.log(`[${processingId}] Movie processing completed successfully`);
    
    return {
      success: true,
      videoUrl: playlistUrl,
      thumbnailUrl,
      cinematicThumbnailUrl,
      duration: videoDuration,
      videoInfo,
      b2Folder: b2VideoFolder
    };
    
  } catch (error) {
    // Log processing error
    await logSecurityEvent({
      type: 'video_processing_error',
      userId,
      data: {
        processingId,
        error: error.message,
        videoTitle: movieData.title
      }
    });
    
    console.error(`[${processingId}] Movie processing failed:`, error);
    throw error;
    
  } finally {
    // 10. Cleanup temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`[${processingId}] Temporary files cleaned up`);
    } catch (cleanupError) {
      console.warn(`[${processingId}] Cleanup warning:`, cleanupError.message);
    }
  }
}

/**
 * Complete video processing pipeline for episodes (Heroku-compatible)
 * Can accept either file paths (from disk storage) or buffers (from memory storage)
 */
export async function processEpisodeUpload(videoInput, episodeData, userId) {
  const processingId = uuidv4();
  // Use OS temp directory for cross-platform compatibility
  const tempDir = path.join(os.tmpdir(), `episode-processing-${processingId}`);
  
  try {
    console.log(`[${processingId}] Starting episode processing: ${episodeData.show_title} S${episodeData.season}E${episodeData.episode}`);
    
    // 1. Create temporary directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // 2. Handle input file (path or buffer)
    const originalVideoPath = path.join(tempDir, 'input.mp4');
    
    // Check if input is file path or buffer
    if (typeof videoInput === 'string') {
      // File path - copy from uploaded location to temp processing directory
      await fs.copyFile(videoInput, originalVideoPath);
      
      // Clean up uploaded file immediately after copying
      await fs.unlink(videoInput);
    } else {
      // Buffer - write directly to temp directory
      await fs.writeFile(originalVideoPath, videoInput);
    }
      // 3. Get video metadata
    console.log(`[${processingId}] Analyzing video metadata...`);
    const videoInfo = await getVideoMetadata(originalVideoPath);
    const videoDuration = Math.round(videoInfo.duration / 60); // Convert to minutes
    
    // 4. Generate episode-specific paths
    const kebabTitle = toKebabCase(episodeData.show_title);
    const episodeId = uuidv4();
    const hlsDir = path.join(tempDir, 'hls');
    const playlistPath = path.join(hlsDir, 'playlist.m3u8');
      // 5. Transcode to HLS
    console.log(`[${processingId}] Transcoding to HLS format...`);
    await fs.mkdir(hlsDir, { recursive: true });
    
    await convertToHLS(originalVideoPath, hlsDir, {
      resolution: '1920x1080',
      bitrate: '4000k',
      segmentDuration: 6,
      hlsPlaylistType: 'vod'
    });
    
    // 6. Generate episode thumbnail from video
    console.log(`[${processingId}] Generating episode thumbnail...`);
    const thumbnailDir = path.join(tempDir, 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });
    
    // Generate single thumbnail at 2 minutes
    const thumbnailPath = path.join(thumbnailDir, 'episode-thumb.jpg');
    await generateThumbnail(originalVideoPath, thumbnailPath, '00:02:00');
    const thumbnails = [thumbnailPath];
    
    // 7. Upload HLS files to B2
    console.log(`[${processingId}] Uploading HLS segments to B2...`);
    const b2VideoFolder = `episodes/${kebabTitle}/s${episodeData.season}e${episodeData.episode}-${episodeId}`;
    const hlsFiles = await fs.readdir(hlsDir);
    const uploadPromises = [];
    
    // Upload main playlist
    const playlistBuffer = await fs.readFile(playlistPath);
    uploadPromises.push(
      uploadToB2(playlistBuffer, `${b2VideoFolder}/playlist.m3u8`, 'application/x-mpegURL')
    );
    
    // Upload segments from quality subdirectories
    for (const file of hlsFiles) {
      const filePath = path.join(hlsDir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        // This is a quality directory (480p, 720p, etc.)
        const qualityFiles = await fs.readdir(filePath);
        for (const qualityFile of qualityFiles) {
          if (qualityFile.endsWith('.ts')) {
            const segmentBuffer = await fs.readFile(path.join(filePath, qualityFile));
            uploadPromises.push(
              uploadToB2(segmentBuffer, `${b2VideoFolder}/${file}/${qualityFile}`, 'video/MP2T')
            );
          }
        }
      } else if (file.endsWith('.ts')) {
        // Direct .ts file in root hls directory (fallback)
        const segmentBuffer = await fs.readFile(path.join(hlsDir, file));
        uploadPromises.push(
          uploadToB2(segmentBuffer, `${b2VideoFolder}/${file}`, 'video/MP2T')
        );
      }
    }
    
    // Upload episode thumbnail
    const thumbnailBuffer = await fs.readFile(thumbnails[0]);
    uploadPromises.push(
      uploadToB2(thumbnailBuffer, `episode-thumbnails/${kebabTitle}-s${episodeData.season}e${episodeData.episode}.jpg`, 'image/jpeg')
    );
    
    await Promise.all(uploadPromises);
    
    // 8. Generate signed URLs for database storage
    const playlistUrl = await generateB2SignedUrl(`${b2VideoFolder}/playlist.m3u8`, 7 * 24 * 60 * 60); // 1 week (B2 max)
    const thumbnailUrl = await generateB2SignedUrl(`episode-thumbnails/${kebabTitle}-s${episodeData.season}e${episodeData.episode}.jpg`, 7 * 24 * 60 * 60);
    
    // 9. Log success
    await logSecurityEvent({
      type: 'episode_processing_success',
      userId,
      data: {
        processingId,
        showTitle: episodeData.show_title,
        season: episodeData.season,
        episode: episodeData.episode,
        duration: videoDuration,
        hlsSegments: hlsFiles.filter(f => f.endsWith('.ts')).length
      }
    });
    
    console.log(`[${processingId}] Episode processing completed successfully`);
    
    return {
      success: true,
      videoUrl: playlistUrl,
      thumbnailUrl,
      duration: videoDuration,
      videoInfo,
      b2Folder: b2VideoFolder
    };
    
  } catch (error) {
    // Log processing error
    await logSecurityEvent({
      type: 'episode_processing_error',
      userId,
      data: {
        processingId,
        error: error.message,
        showTitle: episodeData.show_title,
        season: episodeData.season,
        episode: episodeData.episode
      }
    });
    
    console.error(`[${processingId}] Episode processing failed:`, error);
    throw error;
    
  } finally {
    // 10. Cleanup temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`[${processingId}] Temporary files cleaned up`);
    } catch (cleanupError) {
      console.warn(`[${processingId}] Cleanup warning:`, cleanupError.message);
    }
  }
}

/**
 * Background cleanup service for failed uploads
 */
export async function cleanupFailedUploads() {
  try {
    const tempPattern = '/tmp/video-processing-*';
    const episodePattern = '/tmp/episode-processing-*';
    
    // Clean up any orphaned temp directories older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // This would need platform-specific implementation
    console.log('Cleanup service: Checking for orphaned temp directories...');
    
  } catch (error) {
    console.error('Cleanup service error:', error);
  }
}