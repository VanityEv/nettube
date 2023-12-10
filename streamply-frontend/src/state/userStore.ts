export const useUserStore = () => {};

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Video } from '../store/videos.types';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import axios from 'axios';
import { useCallback } from 'react';

export type UserState = {
    username: string;
    likes: number[]
};

type UserActions = {
  setUserData: (username: string) => void;
  reset: () => void;
};

const initialState: UserState = {
  username: '',
  likes: [],
};

const getUserLikes = async () => {

}

export const useVideosStore = create<UserState & UserActions>()(
  persist(
    set => ({
      ...initialState,
      reset: () => {
        set(initialState);
      },
      setUserData: (username: string) => {
        // try {
        //     const userLikes = await getUserLikes();
        // }
        // set({ 
        //     username: username,
        //  });
      }
    }),
    { name: 'userStorage', storage: createJSONStorage(() => localStorage) }
  )
);
