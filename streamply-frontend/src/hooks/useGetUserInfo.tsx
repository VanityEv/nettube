import { HttpClient } from '../utils/httpClient';
import { api } from '../constants';
import { useQuery } from '@tanstack/react-query';

type ProfileInfo = {
  fullname: string;
  email: string;
  birthdate: string;
};

export type AvatarResponse = {
  result: string;
};

type UserData = {
  user: ProfileInfo;
  avatarUrl: string; // Change the type here
};

const fetchUser = async (username: string) => {
  try {
    const response = await HttpClient.post(`${api}/user/getUserData`, {
      username: username,
    }) as ProfileInfo;

    return response;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

const fetchAvatar = async (username: string) => {
  try {
    const response = await HttpClient.get(`${api}/user/getAvatar/${username}`) as AvatarResponse;

    // Check if avatar was found and is a valid URL
    if (response.result === 'AVATAR_NOT_FOUND') {
      return '';
    }
    // Return the full B2 signed URL directly (don't prefix with api)
    return response.result;
  } catch (error) {
    return '';
  }
};

export const useFetchUser = (username: string) => {
  const {
    data: userData,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
  } = useQuery<UserData, Error>({
    queryKey: ['userInfo'],
    queryFn: async () => {
      const userPromise = fetchUser(username);
      const avatarPromise = fetchAvatar(username);

      const [user, avatarUrl] = await Promise.all([userPromise, avatarPromise]);

      return { user, avatarUrl };
    },
    refetchOnWindowFocus: false,
  });

  return {
    userData,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  };
};
