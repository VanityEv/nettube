import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Video } from '../store/videos.types';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import axios from 'axios';

export type VideoState = {
  videos: Video[];
  genres: string[];
};

type VideoActions = {
  setVideos: () => void;
  reset: () => void;
};

const initialState: VideoState = {
  videos: [],
  genres: [],
};

const getVideos = async () => {
  try {
    const response = await axios.get<Video[]>(SERVER_ADDR + ':' + SERVER_PORT + '/videos/all');
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error('error');
  }
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
          const videosData = await getVideos();
          const uniqueGenres = new Set(videosData?.map(video => video.genre));
          set(() => ({
            videos: videosData,
            genres: Array.from(uniqueGenres),
          }));
        } catch (error) {
          console.error('error');
        }
      },
    }),
    { name: 'videoStorage', storage: createJSONStorage(() => localStorage) }
  )
);
