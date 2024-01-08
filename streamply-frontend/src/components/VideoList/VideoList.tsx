import { useVideosStore } from '../../state/videosStore';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { HorizontalVideo } from '../VideoViews/HorizontalVideo';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Scrollbar } from 'swiper';
import { Video } from '../../types/videos.types';
import { capitalizeFirstLetter } from '../../helpers/capitalizeFirstLetter';

export const VideoList = ({ type }: { type: 'film' | 'series' }) => {
  const { videos } = useVideosStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  const videosByGenre: Video[] = videos.filter(video => video.type === type);

  const groupedVideos: { [genre: string]: Video[] } = videosByGenre.reduce((acc, video) => {
    const genre = video.genre;

    if (!acc[genre]) {
      acc[genre] = [video];
    } else {
      acc[genre].push(video);
    }

    return acc;
  }, {} as Record<string, Video[]>);

  return (
    <>
      {Object.entries(groupedVideos).map(([genre, videos]) => (
        <Box key={genre} sx={{ width: '100%', my: '2rem' }}>
          <Typography variant={'h5'} color="white" sx={{ ml: '2rem', mb: '1rem', fontWeight: '700' }}>
            {type === 'film'
              ? `Movies of genre ${capitalizeFirstLetter(genre)}`
              : `Series of genre ${capitalizeFirstLetter(genre)}`}
          </Typography>
          {videos.length < 3 ? (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: '2rem' }}>
              {videos.map(video => (
                <HorizontalVideo key={`video-genre-${genre}-${video.title}`} video={video} />
              ))}
            </Box>
          ) : (
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
          )}
        </Box>
      ))}
    </>
  );
};
