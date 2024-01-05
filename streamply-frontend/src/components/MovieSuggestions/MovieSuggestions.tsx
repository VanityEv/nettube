import axios from 'axios';
import { useUserStore } from '../../state/userStore';
import { useVideosStore } from '../../state/videosStore';
import { useEffect } from 'react';
import { SERVER_ADDR, SERVER_PORT } from '../../constants';
import { useGetRecommendations } from '../../hooks/useGetRecommendations';
import { Box, Typography } from '@mui/material';
import { HorizontalVideo } from '../VideoViews/HorizontalVideo';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Scrollbar } from 'swiper';

export const MovieSuggestions = () => {
  const { likes } = useUserStore();
  const { videos } = useVideosStore();
  const { username } = useUserStore();

  const likedGenres: string[] = videos.filter(video => likes.includes(video.id)).map(video => video.genre);

  const genreCount: Record<string, number> = likedGenres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert the object to an array of [genre, count] pairs
  const genreCountArray: [string, number][] = Object.entries(genreCount);

  // Sort the array by count in descending order, and then by random if counts are equal
  genreCountArray.sort((a, b) => b[1] - a[1] || Math.random() - 0.5);

  // Pick 3 most liked genres by user
  const top3Genres: string[] = genreCountArray.slice(0, 3).map(pair => pair[0]);

  const { data } = useGetRecommendations(username, top3Genres);

  if (!data) {
    return <></>;
  }

  return (
    <>
      <Typography variant={'h4'} color="white" sx={{ ml: '2rem', fontWeight: '700' }}>
        You Might Like
      </Typography>
      <Box sx={{ width: '100%' }}>
        <Swiper
          modules={[Navigation, Scrollbar, Autoplay]}
          slidesPerView={3}
          loop
          draggable
          navigation
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}
        >
          {data.map(recommendation => (
            <SwiperSlide key={`recommendation-${recommendation.id}`}>
              <HorizontalVideo video={recommendation} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </>
  );
};
