import axios from 'axios';
import { api } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { ProgressedVideo } from '../types/videos.types';
import { getCookie } from 'typescript-cookie';

type RecommendationsResponse = {
  result: string;
  progressedVideos: ProgressedVideo[];
};

const fetchProgressedVideos = async (username: string) => {
  try {
    const response = await axios.get<RecommendationsResponse>(
      `${api}/videos/getProgressed/${username}`,
      { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
    );

    if (response.data.result === 'SUCCESS') {
      return response.data.progressedVideos;
    } else {
      console.error(response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching progressed videos:', error);
    return [];
  }
};

export const useGetProgressedVideos = (username: string) => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery<ProgressedVideo[], Error>({
    queryKey: ['progressedVideos', username],
    queryFn: () => fetchProgressedVideos(username),
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
