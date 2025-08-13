import { HttpClient } from '../utils/httpClient';
import { api } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { Episode } from '../types/videos.types';

type EpisodesResponse = {
  result: string;
  episodes: Episode[];
};

const fetchEpisodes = async (id: number) => {
  try {
    const response = await HttpClient.get(`${api}/videos/episodes/${id}`) as EpisodesResponse;
    if (response.result === 'SUCCESS') {
      return response.episodes;
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
