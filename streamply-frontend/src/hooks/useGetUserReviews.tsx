import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useQuery } from '@tanstack/react-query';

export type SingleUserReview = {
  comment: string;
  grade: number;
  title?: string;
  comment_date: string;
};

type ReviewsResponse = {
  result: string;
  reviews: SingleUserReview[];
};

const fetchUserReviews = async (username: string) => {
  try {
    const response = await axios.get<ReviewsResponse>(`${SERVER_ADDR}:${SERVER_PORT}/reviews/userReviews/${username}`);

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

export const useGetUserReviews = (username: string) => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery<ReviewsResponse, Error>({
    queryKey: ['userReviews'],
    queryFn: () => fetchUserReviews(username),
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
