// SECURITY: Prisma-based Video service to replace vulnerable raw SQL queries
// This prevents SQL injection attacks through parameterized queries

import prisma from '../prisma.js';

const getOneVideo = async (title, requestCallback) => {
  try {
    const video = await prisma.video.findFirst({
      where: { title: title }
    });
    requestCallback(video ? [video] : []);
  } catch (error) {
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

const deleteVideo = async (title, requestCallback) => {
  try {
    const result = await prisma.video.deleteMany({
      where: { title: title }
    });
    requestCallback({ affectedRows: result.count });
  } catch (error) {
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
        showId: parseInt(episode.show),
        season: parseInt(episode.season),
        episode: parseInt(episode.episode),
        episodeName: episode.title,
        description: episode.description,
        videoUrl: episode.videoUrl
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
      where: { showId: parseInt(id) },
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
      episode_name: ep.episodeName,
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
    
    // Get all videos that aren't liked by the user
    const allVideos = await prisma.video.findMany({
      where: {
        id: { notIn: likedVideoIds }
      },
      orderBy: [
        { views: 'desc' },
        { grade: 'desc' }
      ]
    });
    
    // Filter videos by genres (handle comma-separated genres)
    const recommendations = allVideos.filter(video => {
      if (!video.genre) return false;
      
      const videoGenres = video.genre.split(',').map(g => g.trim().toLowerCase());
      return genres.some(targetGenre => 
        videoGenres.some(videoGenre => videoGenre === targetGenre.toLowerCase())
      );
    });
    
    // Limit results
    const limitedRecommendations = recommendations.slice(0, recordsPerGenre * genres.length);
    
    resultCallback(limitedRecommendations);
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
            thumbnail: true,
            videoLength: true
          }
        }
      }
    });
    
    const formattedVideos = progressedVideos.map(pv => ({
      id: pv.video.id,
      type: pv.video.type,
      title: pv.video.title,
      thumbnail: pv.video.thumbnail,
      video_length: pv.video.videoLength,
      season: pv.season,
      episode: pv.episode,
      time_watched: pv.timeWatched
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
          { showId: parseInt(showID) },
          { user: { username: username } }
        ]
      }
    });
    resultCallback(progress ? [progress] : []);
  } catch (error) {
    resultCallback({ error: error.message });
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
        showId: parseInt(showID),
        userId: user.id,
        season: 0,
        episode: null,
        timeWatched: Math.round(timestamp)
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
          { showId: parseInt(showID) },
          { user: { username: username } }
        ]
      },
      data: {
        timeWatched: Math.round(timestamp)
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
        showId: parseInt(showID),
        userId: user.id,
        season: parseInt(season),
        episode: parseInt(episode),
        timeWatched: Math.round(timestamp)
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
          { showId: parseInt(showID) },
          { user: { username: username } }
        ]
      },
      data: {
        timeWatched: Math.round(timestamp),
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
          { showId: parseInt(showID) },
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
      where: { id: parseInt(showID) },
      select: { videoLength: true }
    });
    
    if (!video) {
      throw new Error('Video not found');
    }
    
    resultCallback([{ video_length: video.videoLength }]);
  } catch (error) {
    resultCallback({ error: error.message });
  }
};

export {
  getOneVideo,
  getVideosByGenre,
  getAllVideos,
  deleteVideo,
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
