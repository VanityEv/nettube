/**
 * Complete Video Processing Service for Heroku + Backblaze B2
 * Handles: MP4/MKV upload → HLS transcoding → B2 storage → cleanup
 */

import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getVideoMetadata, convertToHLS, generateThumbnail } from './ffmpegUtils.js';
import { uploadToB2, downloadFromB2, deleteFromB2, generateB2SignedUrl } from './b2Helpers.js';
import { logSecurityEvent } from '../security/mongoLogger.js';

/**
 * Complete video processing pipeline for movies
 */
export async function processMovieUpload(videoBuffer, thumbnailBuffer, movieData, userId) {
  const processingId = uuidv4();
  const tempDir = `/tmp/video-processing-${processingId}`;
  
  try {
    console.log(`[${processingId}] Starting movie processing for: ${movieData.title}`);
    
    // 1. Create temporary directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // 2. Save input files to temp directory
    const originalVideoPath = path.join(tempDir, 'input.mp4');
    const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
    
    await fs.writeFile(originalVideoPath, videoBuffer);
    await fs.writeFile(thumbnailPath, thumbnailBuffer);
      // 3. Get video metadata
    console.log(`[${processingId}] Analyzing video metadata...`);
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
    
    // Generate multiple thumbnails at different timestamps
    const thumbnails = [];
    for (let i = 0; i < 10; i++) {
      const timestamp = `00:0${Math.floor(i * 2)}:0${(i * 15) % 60}`;
      const thumbPath = path.join(previewDir, `thumb-${i}.jpg`);
      await generateThumbnail(originalVideoPath, thumbPath, timestamp);
      thumbnails.push(thumbPath);
    }
    
    // 7. Upload HLS files to B2
    console.log(`[${processingId}] Uploading HLS segments to B2...`);
    const b2VideoFolder = `movies/${kebabTitle}-${videoId}`;
    const hlsFiles = await fs.readdir(hlsDir);
    const uploadPromises = [];
    
    // Upload main playlist
    const playlistBuffer = await fs.readFile(playlistPath);
    uploadPromises.push(
      uploadToB2(playlistBuffer, `${b2VideoFolder}/playlist.m3u8`, 'application/x-mpegURL')
    );
    
    // Upload segments
    for (const file of hlsFiles) {
      if (file.endsWith('.ts')) {
        const segmentBuffer = await fs.readFile(path.join(hlsDir, file));
        uploadPromises.push(
          uploadToB2(segmentBuffer, `${b2VideoFolder}/${file}`, 'video/MP2T')
        );
      }
    }
    
    // Upload thumbnail
    uploadPromises.push(
      uploadToB2(thumbnailBuffer, `thumbnails/${kebabTitle}-${videoId}.jpg`, 'image/jpeg')
    );
    
    // Upload preview thumbnails
    for (let i = 0; i < thumbnails.length; i++) {
      const thumbBuffer = await fs.readFile(thumbnails[i]);
      uploadPromises.push(
        uploadToB2(thumbBuffer, `previews/${kebabTitle}-${videoId}/thumb-${i}.jpg`, 'image/jpeg')
      );
    }
    
    await Promise.all(uploadPromises);
    
    // 8. Generate signed URLs for database storage
    const playlistUrl = await generateB2SignedUrl(`${b2VideoFolder}/playlist.m3u8`, 365 * 24 * 60 * 60); // 1 year
    const thumbnailUrl = await generateB2SignedUrl(`thumbnails/${kebabTitle}-${videoId}.jpg`, 365 * 24 * 60 * 60);
    
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
 * Complete video processing pipeline for episodes
 */
export async function processEpisodeUpload(videoBuffer, episodeData, userId) {
  const processingId = uuidv4();
  const tempDir = `/tmp/episode-processing-${processingId}`;
  
  try {
    console.log(`[${processingId}] Starting episode processing: ${episodeData.show_title} S${episodeData.season}E${episodeData.episode}`);
    
    // 1. Create temporary directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // 2. Save input file to temp directory
    const originalVideoPath = path.join(tempDir, 'input.mp4');
    await fs.writeFile(originalVideoPath, videoBuffer);
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
    
    // Upload segments
    for (const file of hlsFiles) {
      if (file.endsWith('.ts')) {
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
    const playlistUrl = await generateB2SignedUrl(`${b2VideoFolder}/playlist.m3u8`, 365 * 24 * 60 * 60); // 1 year
    const thumbnailUrl = await generateB2SignedUrl(`episode-thumbnails/${kebabTitle}-s${episodeData.season}e${episodeData.episode}.jpg`, 365 * 24 * 60 * 60);
    
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

/**
 * Utility function for kebab case conversion
 */
function toKebabCase(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_:]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}
