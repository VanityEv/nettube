import * as dotenv from 'dotenv';
dotenv.config();

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { transcodeToHLS } from './services/video/ffmpegUtils.js';

async function testHLSSegmentation() {
  console.log('=== HLS SEGMENTATION TEST ===');
  
  // Create a temp directory
  const tempDir = path.join(os.tmpdir(), 'hls-test');
  await fs.mkdir(tempDir, { recursive: true });
  
  console.log('Temp directory:', tempDir);
  
  // Note: You'll need to provide a test video file
  // For now, let's just check what files exist in your current temp folders
  
  // Check if there are any existing temp files from recent uploads
  const streamplyTempDir = path.join(os.tmpdir(), 'streamply');
  
  try {
    const tempContents = await fs.readdir(streamplyTempDir);
    console.log('Streamply temp directory contents:', tempContents);
    
    // Check each subdirectory for HLS files
    for (const item of tempContents) {
      const itemPath = path.join(streamplyTempDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        console.log(`\n--- Checking directory: ${item} ---`);
        try {
          const hlsDir = path.join(itemPath, 'hls');
          const hlsFiles = await fs.readdir(hlsDir);
          console.log('HLS files generated:', hlsFiles);
          
          // Count .ts files specifically
          const tsFiles = hlsFiles.filter(f => f.endsWith('.ts'));
          console.log(`Number of .ts segments: ${tsFiles.length}`);
          console.log('TS files:', tsFiles);
          
        } catch (hlsError) {
          console.log('No HLS directory or error:', hlsError.message);
        }
      }
    }
    
  } catch (error) {
    console.log('No streamply temp directory found or error:', error.message);
  }
  
  // Clean up
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (cleanupError) {
    console.log('Cleanup warning:', cleanupError.message);
  }
}

testHLSSegmentation().catch(console.error);
