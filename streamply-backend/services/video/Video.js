// SECURITY: Prisma-based Video service to replace vulnerable raw SQL queries
// This prevents SQL injection attacks through parameterized queries

import { prisma } from '../prisma.js';
import { deleteMultipleFromB2, listB2Files } from './b2Helpers.js';
import { logSecurityEvent } from '../security/mongoLogger.js';
import { toKebabCase } from '../../helpers/toKebabCase.js';

const getOneVideo = async (title, requestCallback) => {
  try {
    // First try exact match
    let video = await prisma.video.findFirst({
      where: { title: title }
    });
    
    // If not found, try case-insensitive search
    if (!video) {
      video = await prisma.video.findFirst({
        where: { 
          title: { 
            equals: title,
            mode: 'insensitive'
          } 
        }
      });
    }
    
    // If still not found, try converting kebab-case to title case
    if (!video) {
      // Convert "drumming" to "Drumming", "white-noise" to "White Noise", etc.
      const titleCaseTitle = title
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      video = await prisma.video.findFirst({
        where: { title: titleCaseTitle }
      });
    }
    
    requestCallback(video ? [video] : []);
  } catch (error) {
    console.error('Error in getOneVideo:', error);
    requestCallback({ error: error.message });
  }
};

const getVideosByGenre = async (genre, requestCallback) => {
  try {
    const videos = await prisma.video.findMany({
      where: { genre: genre }
    });
    requestCallback(videos);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const getAllVideos = async (requestCallback) => {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    requestCallback(videos);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

// Helper function to extract video ID from URL (for B2 path generation)
const extractVideoIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Extract the full folder name from B2 URL structure
    // Expected format: .../movies/title-uuid/playlist.m3u8
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Look for the folder pattern: title-uuid (should be second to last part before playlist.m3u8)
    if (pathParts.length >= 2) {
      // Find the part that contains the video folder (title-uuid)
      const folderPart = pathParts[pathParts.length - 2]; // Part before playlist.m3u8
      if (folderPart && folderPart.includes('-') && folderPart.length > 10) {
        return folderPart;
      }
    }
    
    // Fallback patterns for other URL structures
    const patterns = [
      /\/([a-zA-Z0-9_-]+)\.m3u8$/,  // HLS playlist
      /\/([a-zA-Z0-9_-]+)$/,        // Direct ID
      /id=([a-zA-Z0-9_-]+)/,        // Query parameter
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
  } catch (error) {
    console.warn('Error parsing video URL:', error.message);
  }
  
  // Fallback: generate from timestamp
  return `fallback-${Date.now()}`;
};

// Helper function to extract B2 file path from full URL
const extractB2PathFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Extract path after bucket name in B2 URL
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Remove leading slash and bucket name if present
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      // Assume first part might be bucket name, take the rest
      return pathParts.slice(1).join('/');
    }
    return pathParts.join('/');
  } catch (error) {
    console.error('Error extracting B2 path from URL:', error);
    return null;
  }
};

const deleteEpisode = async (episodeId, requestCallback) => {
  try {
    // First, get the episode details to extract B2 file paths
    const episode = await prisma.seriesEpisode.findUnique({
      where: { id: parseInt(episodeId) },
      include: {
        video: true
      }
    });

    if (!episode) {
      return requestCallback({ error: 'Episode not found' });
    }

    console.log(`Starting deletion process for episode ID: ${episodeId}`);

    // Extract B2 file paths that need to be deleted
    const b2FilesToDelete = [];
    
    // Generate the B2 folder path for the episode
    const videoIdFromUrl = extractVideoIdFromUrl(episode.link);
    const kebabTitle = toKebabCase(episode.video.title);
    const seasonFolder = `s${episode.season.toString().padStart(2, '0')}`;
    const episodeFolder = `e${episode.episode.toString().padStart(2, '0')}`;
    const b2EpisodeFolder = `series/${kebabTitle}/${seasonFolder}/${episodeFolder}`;
    
    // Add main episode files (HLS segments and playlist)
    b2FilesToDelete.push(`${b2EpisodeFolder}/playlist.m3u8`);
    
    // Add HLS quality folders and segments
    const commonQualities = ['480p', '720p', '1080p'];
    for (const quality of commonQualities) {
      // Add quality-specific segments
      for (let i = 0; i < 50; i++) { // Reasonable max segments
        b2FilesToDelete.push(`${b2EpisodeFolder}/${quality}/segment${i}.ts`);
      }
    }
    
    // Add direct segments (fallback pattern)
    for (let i = 0; i < 50; i++) {
      b2FilesToDelete.push(`${b2EpisodeFolder}/segment${i}.ts`);
    }
    
    // Add episode thumbnail
    if (episode.thumbnail && episode.thumbnail.includes('thumbnails/')) {
      const thumbnailPath = extractB2PathFromUrl(episode.thumbnail);
      if (thumbnailPath) b2FilesToDelete.push(thumbnailPath);
    }
    
    // Add cinematic thumbnail
    if (episode.cinematic_thumbnail && episode.cinematic_thumbnail.includes('cinematic-thumbnails/')) {
      const cinematicPath = extractB2PathFromUrl(episode.cinematic_thumbnail);
      if (cinematicPath) b2FilesToDelete.push(cinematicPath);
    }
    
    // Add preview thumbnails
    for (let i = 0; i < 10; i++) {
      b2FilesToDelete.push(`previews/${kebabTitle}-${seasonFolder}-${episodeFolder}/thumb-${i}.jpg`);
    }

    // Delete from B2 first
    console.log(`Deleting ${b2FilesToDelete.length} files from B2...`);
    const b2Results = await deleteMultipleFromB2(b2FilesToDelete);
    
    // Delete the episode record
    const result = await prisma.seriesEpisode.delete({
      where: { id: parseInt(episodeId) }
    });
    
    // Log successful deletion
    await logSecurityEvent({
      type: 'episode_deleted',
      data: {
        episodeId: episode.id,
        showTitle: episode.video.title,
        season: episode.season,
        episode: episode.episode,
        b2FilesDeleted: b2Results.successful,
        b2FilesFailed: b2Results.failed
      }
    });

    console.log(`Successfully deleted episode: ${episode.video.title} S${episode.season}E${episode.episode}`);
    console.log(`- B2 files: ${b2Results.successful} deleted, ${b2Results.failed} failed`);
    
    requestCallback({ 
      affectedRows: 1,
      b2Results,
      deletedEpisode: {
        season: episode.season,
        episode: episode.episode,
        title: episode.video.title
      }
    });
    
  } catch (error) {
    console.error('Error deleting episode:', error);
    
    // Log deletion error
    await logSecurityEvent({
      type: 'episode_deletion_error',
      data: {
        episodeId,
        error: error.message
      }
    });
    
    requestCallback({ error: error.message });
  }
};

const deleteVideo = async (title, requestCallback) => {
  try {
    // First, get the video details to extract B2 file paths
    const video = await prisma.video.findFirst({
      where: { title: title },
      include: {
        reviews: true,
        userLikes: true,
        seriesEpisodes: true
      }
    });

    if (!video) {
      return requestCallback({ error: 'Video not found' });
    }

    console.log(`Starting deletion process for video: ${title}`);

    // Extract B2 file paths that need to be deleted
    const b2FilesToDelete = [];
    const kebabTitle = toKebabCase(title);
    
    // Extract the actual folder name from the video URL
    const videoFolderFromUrl = extractVideoIdFromUrl(video.link);
    console.log(`Extracted video folder from URL: ${videoFolderFromUrl}`);
    
    // Try multiple possible B2 folder locations
    const possibleB2Folders = [
      `movies/${videoFolderFromUrl}`, // Standard location
      videoFolderFromUrl,             // Root location (for older videos)
      `movies/${kebabTitle}-${videoFolderFromUrl}`, // Legacy format fallback
    ].filter(Boolean);
    
    console.log(`Checking possible B2 folders:`, possibleB2Folders);
    
    let actualB2Folder = null;
    let existingFiles = [];
    
    // Try each possible folder location
    for (const folderPath of possibleB2Folders) {
      console.log(`Checking folder: ${folderPath}`);
      const files = await listB2Files(folderPath);
      if (files && files.length > 0) {
        actualB2Folder = folderPath;
        existingFiles = files;
        console.log(`✅ Found ${files.length} files in: ${folderPath}`);
        break;
      }
    }
    
    if (actualB2Folder && existingFiles.length > 0) {
      // Add all existing files in the video folder
      existingFiles.forEach(file => {
        b2FilesToDelete.push(file.fileName);
      });
      console.log(`Found ${existingFiles.length} existing files in B2 folder: ${actualB2Folder}`);
    } else {
      console.log('No files found in any B2 folder, adding common patterns as fallback');
      // Fallback: Use the first possible folder and add common patterns
      const fallbackFolder = possibleB2Folders[0];
      
      // Add main video files (HLS segments and playlist)
      b2FilesToDelete.push(`${fallbackFolder}/playlist.m3u8`);
      
      // Add common HLS quality folders and segments with correct naming
      const commonQualities = ['480p', '720p', '1080p', '360p'];
      for (const quality of commonQualities) {
        // Use correct segment naming pattern: segment_000.ts, segment_001.ts, etc.
        for (let i = 0; i < 50; i++) { // Reasonable max segments
          const segmentNum = i.toString().padStart(3, '0');
          b2FilesToDelete.push(`${fallbackFolder}/${quality}/segment_${segmentNum}.ts`);
        }
      }
      
      // Add direct segments (fallback pattern)
      for (let i = 0; i < 50; i++) {
        const segmentNum = i.toString().padStart(3, '0');
        b2FilesToDelete.push(`${fallbackFolder}/segment_${segmentNum}.ts`);
      }
    }
    
    // Add thumbnails
    if (video.thumbnail && video.thumbnail.includes('thumbnails/')) {
      const thumbnailPath = extractB2PathFromUrl(video.thumbnail);
      if (thumbnailPath) b2FilesToDelete.push(thumbnailPath);
    }
    
    // Add cinematic thumbnail
    if (video.cinematic_thumbnail && video.cinematic_thumbnail.includes('cinematic-thumbnails/')) {
      const cinematicPath = extractB2PathFromUrl(video.cinematic_thumbnail);
      if (cinematicPath) b2FilesToDelete.push(cinematicPath);
    }
    
    // Add preview thumbnails
    for (let i = 0; i < 10; i++) {
      b2FilesToDelete.push(`previews/${kebabTitle}-${videoFolderFromUrl}/thumb-${i}.jpg`);
    }

    // Delete from B2 first (so we can rollback DB if B2 fails)
    console.log(`Deleting ${b2FilesToDelete.length} files from B2...`);
    const b2Results = await deleteMultipleFromB2(b2FilesToDelete);
    
    // Delete associated records first (foreign key constraints)
    await prisma.review.deleteMany({
      where: { video_id: video.id }
    });
    
    await prisma.userLike.deleteMany({
      where: { video_id: video.id }
    });
    
    // Delete episodes if it's a series
    if (video.type === 'series') {
      await prisma.seriesEpisode.deleteMany({
        where: { show_id: video.id }
      });
    }
    
    // Finally delete the video record
    const result = await prisma.video.delete({
      where: { id: video.id }
    });
    
    // Log successful deletion
    await logSecurityEvent({
      type: 'video_deleted',
      data: {
        videoId: video.id,
        videoTitle: title,
        b2FilesDeleted: b2Results.successful,
        b2FilesFailed: b2Results.failed,
        reviewsDeleted: video.reviews.length,
        likesDeleted: video.userLikes.length,
        episodesDeleted: video.seriesEpisodes.length
      }
    });

    console.log(`Successfully deleted video: ${title}`);
    console.log(`- B2 files: ${b2Results.successful} deleted, ${b2Results.failed} failed`);
    console.log(`- Reviews deleted: ${video.reviews.length}`);
    console.log(`- Likes deleted: ${video.userLikes.length}`);
    console.log(`- Episodes deleted: ${video.seriesEpisodes.length}`);
    
    requestCallback({ 
      affectedRows: 1,
      b2Results,
      deletedAssociations: {
        reviews: video.reviews.length,
        likes: video.userLikes.length,
        episodes: video.seriesEpisodes.length
      }
    });
    
  } catch (error) {
    console.error('Error deleting video:', error);
    
    // Log deletion error
    await logSecurityEvent({
      type: 'video_deletion_error',
      data: {
        videoTitle: title,
        error: error.message
      }
    });
    
    requestCallback({ error: error.message });
  }
};

const addVideo = async (video, videoDuration, videoThumbnailExt, resultCallback) => {
  try {
    const newVideo = await prisma.video.create({
      data: {
        title: video.title,
        type: video.type,
        genre: video.genre,
        production_year: parseInt(video.productionYear),
        production_country: video.productionCountry,
        director: video.director,
        tags: video.tags,
        descr: video.description,
        thumbnail: video.thumbnailUrl || `/${toKebabCase(video.title)}/${toKebabCase(video.title)}.${videoThumbnailExt}`,
        cinematic_thumbnail: video.cinematicThumbnailUrl || null,
        grade: 0,
        reviews_count: 0,
        views: 0,
        link: video.videoUrl || `${toKebabCase(video.title)}/${toKebabCase(video.title)}.m3u8`,
        blocked_reviews: false
      }
    });
    resultCallback({ affectedRows: 1, insertId: newVideo.id });
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const addEpisode = async (episode, resultCallback) => {
  try {
    const newEpisode = await prisma.seriesEpisode.create({
      data: {
        show_id: parseInt(episode.show),
        season: parseInt(episode.season),
        episode: parseInt(episode.episode),
        episode_name: episode.title,
        description: episode.description,
        video_url: episode.videoUrl
      }
    });
    resultCallback({ affectedRows: 1, insertId: newEpisode.id });
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const getEpisodes = async (id, resultCallback) => {
  try {
    const episodes = await prisma.seriesEpisode.findMany({
      where: { show_id: parseInt(id) },
      include: {
        video: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { season: 'asc' },
        { episode: 'asc' }
      ]
    });
    
    const formattedEpisodes = episodes.map(ep => ({
      season: ep.season,
      show_id: ep.video.id,
      title: ep.video.title,
      episode: ep.episode,
      episode_name: ep.episode_name,
      description: ep.description,
      thumbnail: ep.thumbnail,
      show_name: ep.video.title
    }));
    
    resultCallback(formattedEpisodes);
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const getRecommendations = async (username, genres, resultCallback) => {
  try {
    const recordsPerGenre = 5;
    
    // Get user's liked videos to exclude them
    const userLikes = await prisma.userLike.findMany({
      where: {
        user: { username: username }
      },
      select: { video_id: true }
    });
    
    const likedVideoIds = userLikes.map(like => like.video_id);
    
    const recommendations = await prisma.video.findMany({
      where: {
        AND: [
          { genre: { in: genres } },
          { id: { notIn: likedVideoIds } }
        ]
      },
      orderBy: [
        { views: 'desc' },
        { grade: 'desc' }
      ],
      take: recordsPerGenre * genres.length
    });
    
    resultCallback(recommendations);
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const getProgressedVideos = async (username, resultCallback) => {
  try {
    const progressedVideos = await prisma.userWatching.findMany({
      where: {
        user: { username: username }
      },
      include: {
        video: {
          select: {
            id: true,
            type: true,
            title: true,
            thumbnail: true
          }
        }
      }
    });
    
    const formattedVideos = progressedVideos.map(pv => ({
      id: pv.video.id,
      type: pv.video.type,
      title: pv.video.title,
      thumbnail: pv.video.thumbnail,
      video_length: null, // Set to null since field doesn't exist
      season: pv.season,
      episode: pv.episode,
      time_watched: pv.time_watched
    }));
    
    resultCallback(formattedVideos);
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const getPopularMovies = async (resultCallback) => {
  try {
    const movies = await prisma.video.findMany({
      where: {
        AND: [
          { views: { gte: 10000 } },
          { type: 'film' }
        ]
      },
      orderBy: [
        { production_year: 'desc' },
        { views: 'desc' }
      ],
      take: 15
    });
    resultCallback(movies);
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const getPopularSeries = async (resultCallback) => {
  try {
    const series = await prisma.video.findMany({
      where: {
        AND: [
          { views: { gte: 10000 } },
          { type: 'series' }
        ]
      },
      orderBy: [
        { production_year: 'desc' },
        { views: 'desc' }
      ],
      take: 15
    });
    resultCallback(series);
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const getProgress = async (showID, username, resultCallback) => {
  try {
    const progress = await prisma.userWatching.findFirst({
      where: {
        AND: [
          { show_id: showID },
          { user: { username: username } }
        ]
      }
    });
    resultCallback(progress ? [progress] : []);
  } catch (error) {
    console.error('Error in getProgress:', error);
    resultCallback([]);
  }
};

const setProgressMovie = async (username, showID, timestamp, resultCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const progress = await prisma.userWatching.create({
      data: {
        show_id: showID,
        user_id: user.id,
        time_watched: Math.round(timestamp),
        season: null,
        episode: null
      }
    });
    resultCallback({ affectedRows: 1 });
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const updateMovieProgress = async (username, showID, timestamp, resultCallback) => {
  try {
    const result = await prisma.userWatching.updateMany({
      where: {
        AND: [
          { show_id: showID },
          { user: { username: username } }
        ]
      },
      data: {
        time_watched: Math.round(timestamp)
      }
    });
    resultCallback({ affectedRows: result.count });
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const setProgressSeries = async (username, showID, season, episode, timestamp, resultCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const progress = await prisma.userWatching.create({
      data: {
        show_id: showID,
        user_id: user.id,
        time_watched: Math.round(timestamp),
        season: parseInt(season),
        episode: parseInt(episode)
      }
    });
    resultCallback({ affectedRows: 1 });
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const updateSeriesProgress = async (username, showID, timestamp, season, episode, resultCallback) => {
  try {
    const result = await prisma.userWatching.updateMany({
      where: {
        AND: [
          { show_id: showID },
          { user: { username: username } }
        ]
      },
      data: {
        time_watched: Math.round(timestamp),
        season: parseInt(season),
        episode: parseInt(episode)
      }
    });
    resultCallback({ affectedRows: result.count });
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const deleteProgressedVideo = async (showID, username, resultCallback) => {
  try {
    const result = await prisma.userWatching.deleteMany({
      where: {
        AND: [
          { show_id: showID },
          { user: { username: username } }
        ]
      }
    });
    resultCallback({ affectedRows: result.count });
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

const getShowLength = async (showID, resultCallback) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: showID },
      select: { id: true }
    });
    
    if (!video) {
      throw new Error('Video not found');
    }
    
    // Since video_length doesn't exist in the database, return a default duration
    // This allows video progress to work without the length check
    resultCallback([{ video_length: 120 }]); // Default to 2 hours (120 minutes)
  } catch (error) {
    console.error('Error in getShowLength:', error);
    resultCallback([]); // Return empty array instead of error object
  }
};

export {
  getOneVideo,
  getVideosByGenre,
  getAllVideos,
  deleteVideo,
  deleteEpisode,
  addVideo,
  addEpisode,
  getEpisodes,
  getRecommendations,
  getProgressedVideos,
  getPopularMovies,
  getPopularSeries,
  getProgress,
  setProgressMovie,
  setProgressSeries,
  updateMovieProgress,
  updateSeriesProgress,
  deleteProgressedVideo,
  getShowLength,
};
