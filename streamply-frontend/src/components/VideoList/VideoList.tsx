import { useVideosStore } from '../../state/videosStore';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { HorizontalVideo } from '../VideoViews/HorizontalVideo';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Scrollbar } from 'swiper';
import { Video } from '../../types/videos.types';

export const VideoList = ({ type }: { type: 'film' | 'series' }) => {
  const { videos } = useVideosStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  const videosByGenre: Video[] = videos.filter(video => video.type === type);

  const groupedVideos: { [genre: string]: Video[] } = videosByGenre.reduce((acc, video) => {
    const genre = video.genre;

    // Check if the genre already exists in the accumulator
    if (!acc[genre]) {
      // If it doesn't exist, create a new entry with an array containing the video
      acc[genre] = [video];
    } else {
      // If it exists, push the video to the existing array
      acc[genre].push(video);
    }

    return acc;
  }, {} as Record<string, Video[]>);

  return (
    <>
      {Object.entries(groupedVideos).map(([genre, videos]) => (
        <Box key={genre} sx={{ width: '100%', my: '2rem' }}>
          <Typography variant={'h5'} color="white" sx={{ ml: '2rem', mb: '1rem', fontWeight: '700' }}>
            {type === 'film' ? `Movies of genre ${genre}` : `Series of genre ${genre}`}
          </Typography>
          <Swiper
            modules={[Navigation, Scrollbar, Autoplay]}
            slidesPerView={isMobile ? 1 : 3}
            loop
            draggable
            navigation
            style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}
          >
            {videos.map(video => (
              <SwiperSlide key={`video-${type}-${video.id}`}>
                <HorizontalVideo video={video} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      ))}
    </>
  );
};
