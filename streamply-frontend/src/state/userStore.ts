export const useUserStore = () => {};

// import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware';
// import { Video } from '../store/videos.types';
// import { SERVER_ADDR, SERVER_PORT } from '../constants';
// import axios from 'axios';
// import { useCallback } from 'react';

// export type UserState = {
//     likes: number[]
// };

// type UserActions = {
//   setLikes: () => void;
//   reset: () => void;
// };

// const initialState: UserState = {
//   likes: [],
// };

// const getUserLikes = useCallback(async () => {
//     const username = localStorage.getItem('username');
//     const response = await axios.get(`/user/userLikes/${username}`);
//     if (response.result === 'SUCCESS') {
//       setLikesData(response.data);
//     }
//   }, []);

// export const useVideosStore = create<VideoState & VideoActions>()(
//   persist(
//     set => ({
//       ...initialState,
//       reset: () => {
//         set(initialState);
//       },
//       setVideos: async () => {
//         try {
//           const videosData = await fetchVideos();
//           const uniqueGenres = new Set(videosData?.map(video => video.genre));
//           set(() => ({
//             videos: videosData,
//             genres: Array.from(uniqueGenres),
//           }));
//         } catch (error) {
//           console.error('error');
//         }
//       },
//     }),
//     { name: 'videoStorage', storage: createJSONStorage(() => localStorage) }
//   )
// );
