import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { UserEntry } from '../types/user.types';

type UserListResponse = {
  result: string;
  data: UserEntry[];
};

const fetchUsers = async () => {
  try {
    const response = await axios.get<UserListResponse>(`${SERVER_ADDR}:${SERVER_PORT}/user/getAllUsers`);
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

export const useGetUsers = () => {
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery<UserEntry[], Error>({
    queryKey: ['userList'],
    queryFn: () => fetchUsers(),
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
