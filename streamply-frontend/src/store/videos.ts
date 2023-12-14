import { createSlice } from '@reduxjs/toolkit';
import type { VideoState } from './videos.types';
import { SERVER_ADDR, SERVER_PORT } from '../constants';

const initialState: VideoState = {
  videos: [],
};

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setVideos(state, action) {
      state.videos = action.payload.videos;
    },
  },
});

export const videosActions = videosSlice.actions;
export default videosSlice;
