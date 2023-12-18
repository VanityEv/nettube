import axios from 'axios';
import { ProfileInfo } from '../components/ProfileCard';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useQuery } from '@tanstack/react-query';

const fetchUser = async (username: string) => {
  try {
    const response = await axios.post<ProfileInfo>(`${SERVER_ADDR}:${SERVER_PORT}/user/getUserData`, {
      username: username,
    });

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

export const useFetchUser = (username: string) => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery<ProfileInfo, Error>({
    queryKey: ['userInfo'],
    queryFn: () => fetchUser(username),
    refetchOnWindowFocus: false,
  });
  return {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  };
};
