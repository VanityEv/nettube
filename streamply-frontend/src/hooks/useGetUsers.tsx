import axios from 'axios';
import { api } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { UserEntry } from '../types/user.types';
import { getCookie } from 'typescript-cookie';

type UserListResponse = {
  result: string;
  data: UserEntry[];
};

const fetchUsers = async () => {
  try {
    const response = await axios.get<UserListResponse>(`${api}/user/getAllUsers`, {
      headers: {
        Authorization: `Bearer ${getCookie('userToken')}`,
      },
    });
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
