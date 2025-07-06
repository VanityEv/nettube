/**
 * Modern FFmpeg utilities to replace deprecated fluent-ffmpeg
 * Uses static binaries for reliable video processing
 */

import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Execute FFmpeg command with promise-based interface
 */
function executeFFmpeg(args, inputBuffer = null) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegStatic, args);
    let stdout = '';
    let stderr = '';

    // Handle input buffer for in-memory processing
    if (inputBuffer) {
      ffmpeg.stdin.write(inputBuffer);
      ffmpeg.stdin.end();
    }

    ffmpeg.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Execute FFprobe command with promise-based interface
 */
function executeFFprobe(args) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn(ffprobeStatic, args);
    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          resolve({ stdout, stderr });
        }
      } else {
        reject(new Error(`FFprobe exited with code ${code}: ${stderr}`));
      }
    });

    ffprobe.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Get video metadata using FFprobe
 */
export async function getVideoMetadata(inputPath) {
  try {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputPath
    ];

    const result = await executeFFprobe(args);
    return result;
  } catch (error) {
    throw new Error(`Failed to get video metadata: ${error.message}`);
  }
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(inputPath) {
  try {
    const metadata = await getVideoMetadata(inputPath);
    const duration = parseFloat(metadata.format?.duration || 0);
    return Math.round(duration / 60); // Return duration in minutes
  } catch (error) {
    throw new Error(`Failed to get video duration: ${error.message}`);
  }
}

/**
 * Convert video to HLS format with multiple quality levels
 */
export async function convertToHLS(inputPath, outputDir, options = {}) {
  try {
    const {
      qualities = [
        { name: '720p', resolution: '1280x720', bitrate: '2500k' },
        { name: '480p', resolution: '854x480', bitrate: '1000k' },
        { name: '360p', resolution: '640x360', bitrate: '500k' }
      ],
      segmentTime = 10,
      playlistType = 'vod'
    } = options;

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const masterPlaylistPath = path.join(outputDir, 'playlist.m3u8');
    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    // Process each quality level
    for (const quality of qualities) {
      const qualityDir = path.join(outputDir, quality.name);
      await fs.mkdir(qualityDir, { recursive: true });

      const playlistFile = `${quality.name}.m3u8`;
      const segmentPattern = path.join(qualityDir, `segment_%03d.ts`);

      const args = [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'fast',
        '-crf', '23',
        '-sc_threshold', '0',
        '-g', '48',
        '-keyint_min', '48',
        '-hls_time', segmentTime.toString(),
        '-hls_playlist_type', playlistType,
        '-b:v', quality.bitrate,
        '-s', quality.resolution,
        '-maxrate', quality.bitrate,
        '-bufsize', (parseInt(quality.bitrate) * 2).toString() + 'k',
        '-hls_segment_filename', segmentPattern,
        path.join(outputDir, playlistFile)
      ];

      await executeFFmpeg(args);

      // Add to master playlist
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate) * 1000},RESOLUTION=${quality.resolution}\n`;
      masterPlaylist += `${playlistFile}\n`;
    }

    // Write master playlist
    await fs.writeFile(masterPlaylistPath, masterPlaylist);

    return {
      masterPlaylist: masterPlaylistPath,
      qualities: qualities.map(q => path.join(outputDir, `${q.name}.m3u8`))
    };
  } catch (error) {
    throw new Error(`Failed to convert to HLS: ${error.message}`);
  }
}

/**
 * Generate video thumbnail
 */
export async function generateThumbnail(inputPath, outputPath, timeStamp = '00:00:01') {
  try {
    const args = [
      '-i', inputPath,
      '-ss', timeStamp,
      '-vframes', '1',
      '-q:v', '2',
      '-f', 'image2',
      outputPath
    ];

    await executeFFmpeg(args);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

/**
 * Process video buffer to HLS (for memory-based processing)
 */
export async function processVideoBufferToHLS(videoBuffer, outputDir, filename) {
  try {
    // Create temporary input file
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempInputPath = path.join(tempDir, `${uuidv4()}.mp4`);
    await fs.writeFile(tempInputPath, videoBuffer);

    // Convert to HLS
    const result = await convertToHLS(tempInputPath, outputDir);

    // Clean up temporary file
    await fs.unlink(tempInputPath);

    return result;
  } catch (error) {
    throw new Error(`Failed to process video buffer: ${error.message}`);
  }
}

/**
 * Validate video file format and properties
 */
export async function validateVideoFile(inputPath, options = {}) {
  try {
    const {
      maxDuration = 7200, // 2 hours in seconds
      allowedCodecs = ['h264', 'h265', 'vp9'],
      maxResolution = { width: 1920, height: 1080 }
    } = options;

    const metadata = await getVideoMetadata(inputPath);
    
    if (!metadata.streams) {
      throw new Error('No video streams found');
    }

    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    if (!videoStream) {
      throw new Error('No video stream found');
    }

    // Check duration
    const duration = parseFloat(metadata.format?.duration || 0);
    if (duration > maxDuration) {
      throw new Error(`Video duration ${duration}s exceeds maximum allowed ${maxDuration}s`);
    }

    // Check codec
    const codec = videoStream.codec_name?.toLowerCase();
    if (!allowedCodecs.includes(codec)) {
      throw new Error(`Video codec ${codec} not allowed. Allowed: ${allowedCodecs.join(', ')}`);
    }

    // Check resolution
    if (videoStream.width > maxResolution.width || videoStream.height > maxResolution.height) {
      throw new Error(`Video resolution ${videoStream.width}x${videoStream.height} exceeds maximum ${maxResolution.width}x${maxResolution.height}`);
    }

    return {
      valid: true,
      duration: Math.round(duration / 60), // in minutes
      codec,
      resolution: { width: videoStream.width, height: videoStream.height },
      fileSize: parseInt(metadata.format?.size || 0)
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Clean up temporary files and directories
 */
export async function cleanupTempFiles(paths) {
  try {
    for (const filePath of paths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore errors for non-existent files
        if (error.code !== 'ENOENT') {
          console.warn(`Failed to cleanup file ${filePath}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
