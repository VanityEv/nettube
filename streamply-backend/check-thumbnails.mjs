import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

async function checkThumbnailUrls() {
  const prisma = new PrismaClient();
  
  try {
    const videos = await prisma.video.findMany({ 
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnail: true
      }
    });
    
    console.log('=== Current Video Thumbnail URLs ===');
    videos.forEach((video, index) => {
      console.log(`${index + 1}. Title: ${video.title}`);
      console.log(`   Thumbnail: ${video.thumbnail}`);
      console.log(`   Is Demo URL: ${video.thumbnail?.includes('demo-b2-bucket') ? 'YES' : 'NO'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error fetching videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkThumbnailUrls();
