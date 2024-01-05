import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { Episode } from '../types/videos.types';

type EpisodesResponse = {
  result: string;
  episodes: Episode[];
};

const fetchEpisodes = async (id: number) => {
  try {
    const response = await axios.get<EpisodesResponse>(`${SERVER_ADDR}:${SERVER_PORT}/videos/episodes/${id}`);
    if (response.data.result === 'SUCCESS') {
      return response.data.episodes;
    } else {
      console.error(response);
      return [];
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const useGetEpisodes = (id: number) => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery<Episode[], Error>({
    queryKey: ['episodes', id],
    queryFn: () => fetchEpisodes(id),
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
