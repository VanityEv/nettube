import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const getMockData = async () => {
  const options = {
    method: 'GET',
    url: 'https://moviesdatabase.p.rapidapi.com/titles',
    params: {
      startYear: '2018',
      list: 'top_rated_english_250',
    },
    headers: {
      'X-RapidAPI-Key': 'f34b36f4fbmsh60a0900ae4215a8p1b4197jsn1dd75f43af0e',
      'X-RapidAPI-Host': 'moviesdatabase.p.rapidapi.com',
    },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const useGetMockData = () => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery({
    queryKey: ['mockData'],
    queryFn: () => getMockData(),
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
