import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUserData } from '../store/slices/userSlice';
import { fetchAllVideosData } from '../store/slices/videosSlice';
import { getCookie } from 'typescript-cookie';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface CustomJwtPayload extends JwtPayload {
  username: string;
}

export const UserInitializer = () => {
  const dispatch = useAppDispatch();
  const { username } = useAppSelector(state => state.user);
  const { videos } = useAppSelector(state => state.videos);

  useEffect(() => {
    const initializeUser = async () => {
      const userToken = getCookie('userToken');

      // Only initialize if we have a token but no username in Redux store
      if (userToken && !username) {
        try {
          // First, try to restore from old Zustand localStorage
          const oldUserStorage = localStorage.getItem('userStorage');

          if (oldUserStorage) {
            const parsedStorage = JSON.parse(oldUserStorage);
            if (parsedStorage?.state?.username) {
              await dispatch(setUserData(parsedStorage.state.username));
              return;
            }
          }

          // If no old storage, try to decode the JWT token to get the username
          const decoded = jwtDecode<CustomJwtPayload>(userToken);

          if (decoded.username) {
            await dispatch(setUserData(decoded.username));
          }
        } catch (error) {
          console.error('UserInitializer: Failed to initialize user data:', error);
        }
      }
    };

    initializeUser();
  }, [dispatch, username]);

  // Separate effect for loading videos data when user is authenticated
  useEffect(() => {
    const loadVideosData = async () => {
      const userToken = getCookie('userToken');

      // Load videos if user is authenticated and videos are empty
      if (userToken && username && videos.length === 0) {
        try {
          await dispatch(fetchAllVideosData());
        } catch (error) {
          console.error('UserInitializer: Failed to load videos data:', error);
        }
      }
    };

    loadVideosData();
  }, [dispatch, username, videos.length]);

  return null; // This component doesn't render anything
};
