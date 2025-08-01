#!/usr/bin/env node

/**
 * Test script to check available videos in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('=== VIDEO DATABASE CHECK ===');

async function checkVideos() {
  try {
    console.log('\nChecking available videos in database...');
    
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        link: true,
        type: true
      },
      take: 5
    });
    
    console.log(`Found ${videos.length} videos:`);
    
    videos.forEach(video => {
      console.log(`\nVideo ID: ${video.id}`);
      console.log(`Title: ${video.title}`);
      console.log(`Type: ${video.type}`);
      console.log(`Has link: ${video.link ? 'Yes' : 'No'}`);
      if (video.link) {
        console.log(`Link: ${video.link.substring(0, 100)}...`);
      }
    });
    
    if (videos.length > 0) {
      console.log(`\n✅ Use this video ID for testing: ${videos[0].id}`);
    } else {
      console.log('\n❌ No videos found in database');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideos();
