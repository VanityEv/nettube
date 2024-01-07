import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { getCookie } from 'typescript-cookie';

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
    const response = await axios.post<ProfileInfo>(
      `${SERVER_ADDR}:${SERVER_PORT}/user/getUserData`,
      {
        username: username,
      },
      { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

const fetchAvatar = async (username: string) => {
  try {
    const response = await axios.get<AvatarResponse>(`${SERVER_ADDR}:${SERVER_PORT}/user/getAvatar/${username}`);

    if (response.status === 200) {
      return response.data.result;
    } else {
      return '';
    }
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
