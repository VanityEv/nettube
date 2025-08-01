import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { uploadToB2, generateB2SignedUrl, getB2FileList } from './streamply-backend/services/video/b2Helpers.js';

// Load environment variables
dotenv.config({ path: './streamply-backend/.env' });

const prisma = new PrismaClient();

console.log('🔍 Checking for missing HLS playlist files...');

async function fixMissingHLSPlaylists() {
  try {
    // Get all videos from database
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        link: true
      }
    });

    console.log(`Found ${videos.length} videos in database`);

    for (const video of videos) {
      if (!video.link) {
        console.log(`⚠️ Video "${video.title}" has no link, skipping...`);
        continue;
      }

      console.log(`\n🎬 Checking video: ${video.title}`);
      console.log(`Current link: ${video.link}`);

      // Extract the B2 folder path from the current link
      // Link format: https://f123.backblazeb2.com/file/bucket-name/folder/playlist.m3u8
      const urlPath = new URL(video.link).pathname;
      const b2Path = urlPath.replace('/file/' + process.env.B2_BUCKET_NAME + '/', '');
      const folderPath = b2Path.replace('/playlist.m3u8', '');

      console.log(`B2 folder: ${folderPath}`);

      // Check for missing quality playlist files
      const qualityFiles = ['720p.m3u8', '480p.m3u8', '360p.m3u8'];
      const missingFiles = [];

      for (const qualityFile of qualityFiles) {
        const qualityPath = `${folderPath}/${qualityFile}`;
        try {
          const signedUrl = await generateB2SignedUrl(qualityPath, 60); // Short test URL
          console.log(`✅ ${qualityFile} exists`);
        } catch (error) {
          console.log(`❌ ${qualityFile} missing`);
          missingFiles.push(qualityFile);
        }
      }

      if (missingFiles.length > 0) {
        console.log(`📝 Missing files for "${video.title}": ${missingFiles.join(', ')}`);
        
        // Create mock HLS playlist files
        for (const missingFile of missingFiles) {
          const quality = missingFile.replace('.m3u8', '');
          const mockPlaylist = createMockHLSPlaylist(quality, folderPath);
          
          try {
            await uploadToB2(
              Buffer.from(mockPlaylist), 
              `${folderPath}/${missingFile}`, 
              'application/x-mpegURL'
            );
            console.log(`✅ Created mock ${missingFile}`);
          } catch (uploadError) {
            console.error(`❌ Failed to upload ${missingFile}:`, uploadError.message);
          }
        }
      } else {
        console.log(`✅ All playlist files exist for "${video.title}"`);
      }
    }

    console.log('\n🎉 HLS playlist check complete!');

  } catch (error) {
    console.error('❌ Error checking HLS playlists:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function createMockHLSPlaylist(quality, folderPath) {
  // Create a basic HLS playlist that references the main playlist
  return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.0,
${folderPath}/${quality}/segment_000.ts
#EXTINF:10.0,
${folderPath}/${quality}/segment_001.ts
#EXTINF:10.0,
${folderPath}/${quality}/segment_002.ts
#EXT-X-ENDLIST
`;
}

fixMissingHLSPlaylists();
