import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '../../constants';
import { Video } from '../../types/videos.types';

// Types
export interface VideosState {
  videos: Video[];
  genres: string[];
  popularMovies: Video[];
  popularSeries: Video[];
  loading: {
    videos: boolean;
    popularMovies: boolean;
    popularSeries: boolean;
  };
  error: string | null;
}

type VideosResponse = {
  result: string;
  data: Video[];
};

type VideosEndpoint = 'all' | 'top-movies' | 'top-series';

// Initial state
const initialState: VideosState = {
  videos: [],
  genres: [],
  popularMovies: [],
  popularSeries: [],
  loading: {
    videos: false,
    popularMovies: false,
    popularSeries: false,
  },
  error: null,
};

// Helper function
const getVideos = async (endpoint: VideosEndpoint): Promise<Video[]> => {
  try {
    const response = await axios.get<VideosResponse>(`${api}/videos/${endpoint}`);
    if (response.data.result === 'SUCCESS') {
      return response.data.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching videos data:', error);
    return [];
  }
};

// Async thunks
export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async () => {
    return await getVideos('all');
  }
);

export const fetchPopularMovies = createAsyncThunk(
  'videos/fetchPopularMovies',
  async () => {
    return await getVideos('top-movies');
  }
);

export const fetchPopularSeries = createAsyncThunk(
  'videos/fetchPopularSeries',
  async () => {
    return await getVideos('top-series');
  }
);

export const fetchAllVideosData = createAsyncThunk(
  'videos/fetchAllVideosData',
  async (_, { dispatch }) => {
    // Fetch all video data in parallel
    const [videosResult, moviesResult, seriesResult] = await Promise.allSettled([
      dispatch(fetchVideos()),
      dispatch(fetchPopularMovies()),
      dispatch(fetchPopularSeries())
    ]);
    
    return {
      videosSuccess: videosResult.status === 'fulfilled',
      moviesSuccess: moviesResult.status === 'fulfilled',
      seriesSuccess: seriesResult.status === 'fulfilled'
    };
  }
);

// Slice
const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setVideos: (state, action: PayloadAction<Video[]>) => {
      state.videos = action.payload;
      // Update genres when videos change
      const uniqueGenres = new Set(action.payload?.map(video => video.genre));
      state.genres = Array.from(uniqueGenres);
    },
    setPopularMovies: (state, action: PayloadAction<Video[]>) => {
      state.popularMovies = action.payload;
    },
    setPopularSeries: (state, action: PayloadAction<Video[]>) => {
      state.popularSeries = action.payload;
    },
    setGenres: (state, action: PayloadAction<string[]>) => {
      state.genres = action.payload;
    },
    reset: (state) => {
      Object.assign(state, initialState);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchVideos
      .addCase(fetchVideos.pending, (state) => {
        state.loading.videos = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading.videos = false;
        state.videos = action.payload;
        // Update genres when videos are fetched
        const uniqueGenres = new Set(action.payload?.map(video => video.genre));
        state.genres = Array.from(uniqueGenres);
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading.videos = false;
        state.error = action.error.message || 'Failed to fetch videos';
      })
      // fetchPopularMovies
      .addCase(fetchPopularMovies.pending, (state) => {
        state.loading.popularMovies = true;
      })
      .addCase(fetchPopularMovies.fulfilled, (state, action) => {
        state.loading.popularMovies = false;
        state.popularMovies = action.payload;
      })
      .addCase(fetchPopularMovies.rejected, (state, action) => {
        state.loading.popularMovies = false;
        state.error = action.error.message || 'Failed to fetch popular movies';
      })
      // fetchPopularSeries
      .addCase(fetchPopularSeries.pending, (state) => {
        state.loading.popularSeries = true;
      })
      .addCase(fetchPopularSeries.fulfilled, (state, action) => {
        state.loading.popularSeries = false;
        state.popularSeries = action.payload;
      })
      .addCase(fetchPopularSeries.rejected, (state, action) => {
        state.loading.popularSeries = false;
        state.error = action.error.message || 'Failed to fetch popular series';
      })
      // fetchAllVideosData
      .addCase(fetchAllVideosData.fulfilled, (state) => {
        // All individual requests handle their own state updates
        // This is just for completion tracking
      });
  },
});

export const { 
  setVideos, 
  setPopularMovies, 
  setPopularSeries, 
  setGenres, 
  reset, 
  clearError 
} = videosSlice.actions;

export default videosSlice.reducer;
