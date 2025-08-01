#!/usr/bin/env node

import prisma from './services/prisma.js';

async function checkVideoData() {
  try {
    console.log('=== CHECKING VIDEO DATABASE ===');
    
    // Get all videos to see what's available
    const videos = await prisma.video.findMany({ take: 10 });
    console.log(`Found ${videos.length} videos in database:`);
    
    videos.forEach(video => {
      console.log(`\n📹 ${video.title}:`);
      console.log(`  Link: ${video.link}`);
      console.log(`  Thumbnail: ${video.thumbnail}`);
      if (video.cinematic_thumbnail) {
        console.log(`  Cinematic: ${video.cinematic_thumbnail}`);
      }
    });
    
    if (videos.length > 0) {
      const sampleVideo = videos[0];
      console.log(`\n🔍 ANALYZING SAMPLE VIDEO: ${sampleVideo.title}`);
      
      // Check how the B2 paths are constructed
      if (sampleVideo.link) {
        console.log('Video link analysis:');
        console.log('Full link:', sampleVideo.link);
        
        // Try to extract the folder name from the link
        const urlParts = sampleVideo.link.split('/');
        console.log('URL parts:', urlParts);
        
        // Look for the actual B2 folder pattern
        const folderPattern = urlParts.find(part => part.includes('-') && part.length > 10);
        if (folderPattern) {
          console.log('Detected folder pattern:', folderPattern);
        }
      }
      
      if (sampleVideo.thumbnail) {
        console.log('\nThumbnail path analysis:');
        console.log('Full thumbnail:', sampleVideo.thumbnail);
        
        // Extract the folder structure from thumbnail path
        const thumbParts = sampleVideo.thumbnail.split('/');
        console.log('Thumbnail parts:', thumbParts);
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideoData();

checkVideoData();
