// SEGMENT 3: Video Data & View Tracking
// Handles video database operations and view count increments

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getVideoAndTrackView(videoId, userId, clientIp) {
  try {
    // 1. Get video information
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { 
        id: true, 
        title: true, 
        video_url: true, 
        link: true,
        type: true,
        views: true
      }
    });
    
    if (!video) {
      return {
        success: false,
        status: 404,
        error: 'Video not found'
      };
    }
    
    // Video found - no spam logging
    
    // 2. Increment video view count
    try {
      await prisma.video.update({
        where: { id: videoId },
        data: {
          views: {
            increment: 1
          }
        }
      });
      
      // View tracking successful - no spam logging
      
    } catch (viewError) {
      // Don't fail the stream if view tracking fails
      console.warn('⚠️ View tracking failed (non-critical):', viewError.message);
    }
    
    return {
      success: true,
      video: video
    };
    
  } catch (error) {
    console.error('Video retrieval error:', error);
    return {
      success: false,
      status: 500,
      error: 'Failed to retrieve video'
    };
  }
}
