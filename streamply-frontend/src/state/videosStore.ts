import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Video } from '../types/videos.types';
import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';

export type VideoState = {
  videos: Video[];
  genres: string[];
  popularMovies: Video[];
  popularSeries: Video[];
};

type VideoActions = {
  setVideos: () => Promise<void>;
  reset: () => void;
};

type VideosEndpoint = 'all' | 'top-movies' | 'top-series';

const getVideos = async (endpoint: VideosEndpoint) => {
  try {
    const response = await axios.get<Video[]>(SERVER_ADDR + ':' + SERVER_PORT + `/videos/${endpoint}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching videos data:', error);
    throw error;
  }
};

const initialState: VideoState = {
  videos: [],
  genres: [],
  popularMovies: [],
  popularSeries: [],
};

export const useVideosStore = create<VideoState & VideoActions>()(
  persist(
    set => ({
      ...initialState,
      reset: () => {
        set(initialState);
      },
      setVideos: async () => {
        try {
          const videosData = await getVideos('all');
          const popularMoviesData = await getVideos('top-movies');
          const popularSeriesData = await getVideos('top-series');
          const uniqueGenres = new Set(videosData?.map(video => video.genre));
          set(() => ({
            videos: videosData,
            genres: Array.from(uniqueGenres),
            popularMovies: popularMoviesData,
            popularSeries: popularSeriesData,
          }));
        } catch (error) {
          console.error('error');
        }
      },
    }),
    { name: 'videoStorage', storage: createJSONStorage(() => localStorage) }
  )
);
