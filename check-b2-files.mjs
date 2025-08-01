import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateB2SignedUrl } from './streamply-backend/services/video/b2Helpers.js';

// Load environment variables
dotenv.config({ path: './streamply-backend/.env' });

const prisma = new PrismaClient();

console.log('🔍 Checking B2 bucket files for videos...');

async function checkB2Files() {
  try {
    // Get a few videos from database
    const videos = await prisma.video.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        link: true
      }
    });

    console.log(`Found ${videos.length} videos in database\n`);

    for (const video of videos) {
      if (!video.link) {
        console.log(`⚠️ Video "${video.title}" has no link, skipping...`);
        continue;
      }

      console.log(`🎬 Video: ${video.title}`);
      console.log(`Link: ${video.link}`);

      // Extract the B2 folder path from the current link
      const urlPath = new URL(video.link).pathname;
      const b2Path = urlPath.replace('/file/' + process.env.B2_BUCKET_NAME + '/', '');
      const folderPath = b2Path.replace('/playlist.m3u8', '');

      console.log(`B2 folder: ${folderPath}`);

      // Check for files
      const filesToCheck = [
        'playlist.m3u8',    // Master playlist
        '720p.m3u8',        // Quality playlists
        '480p.m3u8',
        '360p.m3u8',
        '720p/segment_000.ts',  // Sample segments
        '480p/segment_000.ts',
        '360p/segment_000.ts'
      ];

      for (const file of filesToCheck) {
        const filePath = `${folderPath}/${file}`;
        try {
          const signedUrl = await generateB2SignedUrl(filePath, 60);
          console.log(`  ✅ ${file} - EXISTS`);
        } catch (error) {
          console.log(`  ❌ ${file} - MISSING`);
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking B2 files:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkB2Files();
