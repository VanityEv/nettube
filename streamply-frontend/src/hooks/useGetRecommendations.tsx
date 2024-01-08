import axios from 'axios';
import { api } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { Video } from '../types/videos.types';
import { getCookie } from 'typescript-cookie';

type RecommendationsResponse = {
  result: string;
  recommendations: Video[];
};

const fetchRecommendations = async (username: string, genres: string[]) => {
  try {
    const response = await axios.post<RecommendationsResponse>(
      `${api}/videos/recommendations/${username}`,
      { genres },
      { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
    );

    if (response.data.result === 'SUCCESS') {
      return response.data.recommendations;
    } else {
      console.error(response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
};

export const useGetRecommendations = (username: string, genres: string[]) => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery<Video[], Error>({
    queryKey: ['recommendations', username],
    queryFn: () => fetchRecommendations(username, genres),
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
