import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { Video } from '../types/videos.types';

type VideoListResponse = {
  result: string;
  data: Video[];
};

const fetchVideos = async () => {
  try {
    const response = await axios.get<VideoListResponse>(`${SERVER_ADDR}:${SERVER_PORT}/videos/all`);
    if (response.data.result === 'SUCCESS') {
      return response.data.data;
    } else {
      console.error(response);
      return [];
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const useGetVideos = () => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery<Video[], Error>({
    queryKey: ['videoList'],
    queryFn: () => fetchVideos(),
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
