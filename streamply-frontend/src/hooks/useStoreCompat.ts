import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  setUserData as setUserDataRedux, 
  fetchUserLikes, 
  reset as resetUser,
  setAvatarUrl 
} from '../store/slices/userSlice';
import { 
  fetchAllVideosData,
  reset as resetVideos 
} from '../store/slices/videosSlice';
import {
  setGenres,
  setSearchValue,
  reset as resetExploration
} from '../store/slices/explorationSlice';

/**
 * Compatibility hook that provides the same interface as useUserStore
 * but uses Redux under the hood. This allows gradual migration.
 */
export const useUserStoreCompat = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  
  return {
    username: user.username,
    avatarUrl: user.avatarUrl,
    likes: user.likes,
    loading: user.loading,
    error: user.error,
    
    // Actions that match the Zustand interface
    setUserData: async (username: string) => {
      await dispatch(setUserDataRedux(username));
    },
    setLikes: async (username: string) => {
      await dispatch(fetchUserLikes(username));
    },
    reset: () => {
      dispatch(resetUser());
    },
    
    // Additional Redux-specific actions
    setAvatarUrl: (url: string) => {
      dispatch(setAvatarUrl(url));
    }
  };
};

/**
 * Compatibility hook that provides the same interface as useVideosStore
 * but uses Redux under the hood.
 */
export const useVideosStoreCompat = () => {
  const dispatch = useAppDispatch();
  const videos = useAppSelector(state => state.videos);
  
  return {
    videos: videos.videos,
    genres: videos.genres,
    popularMovies: videos.popularMovies,
    popularSeries: videos.popularSeries,
    loading: videos.loading,
    error: videos.error,
    
    // Actions that match the Zustand interface
    setVideos: async () => {
      await dispatch(fetchAllVideosData());
    },
    reset: () => {
      dispatch(resetVideos());
    }
  };
};

/**
 * Compatibility hook that provides the same interface as useExplorationStore
 * but uses Redux under the hood.
 */
export const useExplorationStoreCompat = () => {
  const dispatch = useAppDispatch();
  const exploration = useAppSelector(state => state.exploration);
  
  return {
    selectedGenres: exploration.selectedGenres,
    searchValue: exploration.searchValue,
    
    // Actions that match the Zustand interface
    setGenres: (genres: string[]) => {
      dispatch(setGenres(genres));
    },
    setSearchValue: (value: string) => {
      dispatch(setSearchValue(value));
    },
    reset: () => {
      dispatch(resetExploration());
    }
  };
};
