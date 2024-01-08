import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../constants';
import axios from 'axios';
import { AvatarResponse } from '../hooks/useGetUserInfo';

type LikeResponse = [{ video_id: number }];

export type UserState = {
  username: string;
  avatarUrl: string;
  likes: number[];
};

type UserActions = {
  setUserData: (username: string) => Promise<void>;
  setLikes: (username: string) => Promise<void>;
  reset: () => void;
};

const initialState: UserState = {
  username: '',
  avatarUrl: '',
  likes: [],
};

const getUserLikes = async (username: string) => {
  try {
    const response = await axios.get<LikeResponse>(`${api}/user/userLikes/${username}`);
    if (response.status === 200) {
      return response.data.map(video => video.video_id);
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error(error);
  }
};

const getUserAvatar = async (username: string) => {
  try {
    const response = await axios.get<AvatarResponse>(`${api}/user/getAvatar/${username}`);

    if (response.status === 200) {
      return response.data.result;
    } else {
      return '';
    }
  } catch (error) {
    console.error('Error fetching avatar:', error);
    throw error;
  }
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    set => ({
      ...initialState,
      reset: () => {
        set(initialState);
      },
      setUserData: async (username: string) => {
        set(() => ({ username: username }));
        try {
          const userLikes = await getUserLikes(username);
          const userAvatarPath = await getUserAvatar(username);
          set(() => ({
            likes: userLikes,
            avatarUrl: `${api}${userAvatarPath}`,
          }));
        } catch (error) {
          console.error(error);
        }
      },
      setLikes: async (username: string) => {
        try {
          const userLikes = await getUserLikes(username);
          set(() => ({
            likes: userLikes,
          }));
        } catch (error) {
          console.error(error);
        }
      },
    }),
    { name: 'userStorage', storage: createJSONStorage(() => localStorage) }
  )
);
