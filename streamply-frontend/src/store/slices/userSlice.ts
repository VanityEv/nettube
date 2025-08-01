import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '../../constants';

// Types
export interface UserState {
  username: string;
  avatarUrl: string;
  likes: number[];
  loading: {
    userData: boolean;
    likes: boolean;
    avatar: boolean;
  };
  error: string | null;
}

export type AvatarResponse = {
  result: string;
};

type LikeResponse = [{ video_id: number }];

// Initial state
const initialState: UserState = {
  username: '',
  avatarUrl: '',
  likes: [],
  loading: {
    userData: false,
    likes: false,
    avatar: false,
  },
  error: null,
};

// Async thunks
export const fetchUserLikes = createAsyncThunk(
  'user/fetchLikes',
  async (username: string) => {
    try {
      const response = await axios.get<LikeResponse>(`${api}/user/userLikes/${username}`);
      if (response.status === 200) {
        const data = response.data as any;
        if (Array.isArray(data)) {
          return data.map((video: any) => video.video_id);
        } else if (data && Array.isArray(data.likes)) {
          return data.likes.map((video: any) => video.video_id);
        } else {
          console.warn('User likes response is not in expected format:', data);
          return [];
        }
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching user likes:', error);
      return [];
    }
  }
);

export const fetchUserAvatar = createAsyncThunk(
  'user/fetchAvatar',
  async (username: string) => {
    try {
      const response = await axios.get<AvatarResponse>(`${api}/user/getAvatar/${username}`);
      
      if (response.status === 200) {
        // Check if avatar was found and is a valid URL
        if (response.data.result === 'AVATAR_NOT_FOUND') {
          return '';
        }
        // Return the full B2 signed URL directly (don't prefix with api)
        return response.data.result;
      } else {
        return '';
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
      throw error;
    }
  }
);

export const setUserData = createAsyncThunk(
  'user/setUserData',
  async (username: string, { dispatch }) => {
    // Set username immediately
    dispatch(userSlice.actions.setUsername(username));
    
    // Fetch likes and avatar in parallel
    const [likesResult, avatarResult] = await Promise.allSettled([
      dispatch(fetchUserLikes(username)),
      dispatch(fetchUserAvatar(username))
    ]);
    
    return {
      username,
      likesSuccess: likesResult.status === 'fulfilled',
      avatarSuccess: avatarResult.status === 'fulfilled'
    };
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    setAvatarUrl: (state, action: PayloadAction<string>) => {
      state.avatarUrl = action.payload;
    },
    setLikes: (state, action: PayloadAction<number[]>) => {
      state.likes = action.payload;
    },
    addLike: (state, action: PayloadAction<number>) => {
      if (!state.likes.includes(action.payload)) {
        state.likes.push(action.payload);
      }
    },
    removeLike: (state, action: PayloadAction<number>) => {
      state.likes = state.likes.filter(id => id !== action.payload);
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
      // fetchUserLikes
      .addCase(fetchUserLikes.pending, (state) => {
        state.loading.likes = true;
        state.error = null;
      })
      .addCase(fetchUserLikes.fulfilled, (state, action) => {
        state.loading.likes = false;
        state.likes = action.payload;
      })
      .addCase(fetchUserLikes.rejected, (state, action) => {
        state.loading.likes = false;
        state.error = action.error.message || 'Failed to fetch user likes';
      })
      // fetchUserAvatar
      .addCase(fetchUserAvatar.pending, (state) => {
        state.loading.avatar = true;
        state.error = null;
      })
      .addCase(fetchUserAvatar.fulfilled, (state, action) => {
        state.loading.avatar = false;
        state.avatarUrl = action.payload;
      })
      .addCase(fetchUserAvatar.rejected, (state, action) => {
        state.loading.avatar = false;
        state.error = action.error.message || 'Failed to fetch user avatar';
      })
      // setUserData
      .addCase(setUserData.pending, (state) => {
        state.loading.userData = true;
        state.error = null;
      })
      .addCase(setUserData.fulfilled, (state) => {
        state.loading.userData = false;
      })
      .addCase(setUserData.rejected, (state, action) => {
        state.loading.userData = false;
        state.error = action.error.message || 'Failed to set user data';
      });
  },
});

export const { 
  setUsername, 
  setAvatarUrl, 
  setLikes, 
  addLike, 
  removeLike, 
  reset, 
  clearError 
} = userSlice.actions;

export default userSlice.reducer;
