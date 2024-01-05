import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { Review } from '../types/reviews.types';

type ReviewsResponse = {
  result: string;
  reviews: Review[];
};

const fetchReviews = async (showId: number) => {
  try {
    const response = await axios.get<ReviewsResponse>(`${SERVER_ADDR}:${SERVER_PORT}/reviews/${showId}`);

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

export const useGetReviews = (showId: number) => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery<ReviewsResponse, Error>({
    queryKey: ['showReviews'],
    queryFn: () => fetchReviews(showId),
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
