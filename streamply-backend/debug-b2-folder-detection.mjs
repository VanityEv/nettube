#!/usr/bin/env node

/**
 * Debug script to test B2 folder detection for video deletion
 */

import { listB2Files } from './services/video/b2Helpers.js';

console.log('=== B2 FOLDER DETECTION DEBUG ===');

async function debugB2FolderDetection() {
  // Family Guy folder that user mentioned
  const familyGuyFolder = 'family-guy-936de1a6-ecd6-4f1b-9274-d8f0e35356c2';
  
  const possibleFolders = [
    `movies/${familyGuyFolder}`,     // movies/family-guy-936de1a6-ecd6-4f1b-9274-d8f0e35356c2
    familyGuyFolder,                 // family-guy-936de1a6-ecd6-4f1b-9274-d8f0e35356c2
    `movies/family-guy-file`,        // Wrong path we were trying before
  ];
  
  console.log('Testing folder detection for Family Guy...');
  console.log('Known correct path: streamply-bucket-prod/movies/family-guy-936de1a6-ecd6-4f1b-9274-d8f0e35356c2');
  console.log('');
  
  for (const folderPath of possibleFolders) {
    try {
      console.log(`🔍 Checking: ${folderPath}`);
      const files = await listB2Files(folderPath);
      
      if (files && files.length > 0) {
        console.log(`✅ FOUND ${files.length} files in: ${folderPath}`);
        console.log('Sample files:');
        files.slice(0, 5).forEach(file => {
          console.log(`  - ${file.fileName}`);
        });
      } else {
        console.log(`❌ No files found in: ${folderPath}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ Error checking ${folderPath}:`, error.message);
      console.log('');
    }
  }
  
  // Also test a known working folder
  console.log('Testing known working video folders...');
  const knownFolders = [
    'movies/white-noise-6142481b-dda2-4965-8b5c-88b778f84b23',
    'movies/drumming-8c206299-3158-478a-a90e-e607fcd54906'
  ];
  
  for (const folderPath of knownFolders) {
    try {
      console.log(`🔍 Checking known folder: ${folderPath}`);
      const files = await listB2Files(folderPath);
      
      if (files && files.length > 0) {
        console.log(`✅ FOUND ${files.length} files`);
      } else {
        console.log(`❌ No files found`);
      }
    } catch (error) {
      console.log(`❌ Error:`, error.message);
    }
  }
}

debugB2FolderDetection().catch(console.error);
