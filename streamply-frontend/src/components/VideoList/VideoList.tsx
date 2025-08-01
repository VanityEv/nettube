import { useAppSelector } from '../../store/hooks';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { HorizontalVideo } from '../VideoViews/HorizontalVideo';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Scrollbar } from 'swiper/modules';
import { Video } from '../../types/videos.types';
import { capitalizeFirstLetter } from '../../helpers/capitalizeFirstLetter';
import SafeVideoList from '../SafeVideoList';
import ErrorBoundary from '../ErrorBoundary';
import { safeArray, isValidArray } from '../../helpers/safeData';

export const VideoList = ({ type }: { type: 'film' | 'series' }) => {
  const { videos } = useAppSelector(state => state.videos);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));

  // Safe handling of videos array
  const safeVideos = safeArray(videos) as Video[];
  const videosByGenre: Video[] = safeVideos.filter((video: Video) => video?.type === type);

  // If no videos, show SafeVideoList with empty state
  if (!isValidArray(videosByGenre)) {
    return (
      <SafeVideoList
        videos={[]}
        emptyStateTitle={`No ${type === 'film' ? 'Movies' : 'Series'} Available`}
        emptyStateDescription={`There are currently no ${
          type === 'film' ? 'movies' : 'series'
        } in the database. Please check back later.`}
      />
    );
  }

  const groupedVideos: { [genre: string]: Video[] } = videosByGenre.reduce((acc, video) => {
    const genre = video?.genre || 'Unknown';

    if (!acc[genre]) {
      acc[genre] = [video];
    } else {
      acc[genre].push(video);
    }

    return acc;
  }, {} as Record<string, Video[]>);

  return (
    <ErrorBoundary
      fallback={<SafeVideoList videos={[]} error={`Error loading ${type === 'film' ? 'movies' : 'series'}`} />}
    >
      {Object.entries(groupedVideos).map(([genre, videos]) => (
        <Box key={genre} sx={{ width: '100%', my: '2rem' }}>
          <Typography variant={'h5'} color="white" sx={{ ml: '2rem', mb: '1rem', fontWeight: '700' }}>
            {type === 'film'
              ? `Movies of genre ${capitalizeFirstLetter(genre)}`
              : `Series of genre ${capitalizeFirstLetter(genre)}`}
          </Typography>

          <ErrorBoundary
            fallback={
              <Box sx={{ p: 2, textAlign: 'center', color: 'white' }}>
                <Typography>
                  Error loading {genre} {type === 'film' ? 'movies' : 'series'}
                </Typography>
              </Box>
            }
          >
            <Swiper
              modules={[Navigation, Scrollbar, Autoplay]}
              slidesPerView={isMobile ? 1 : 3}
              draggable
              navigation
              style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}
            >
              {safeArray(videos).map((video: any, index: number) => (
                <SwiperSlide key={(video as Video)?.id || `video-${type}-${index}`}>
                  <ErrorBoundary
                    fallback={
                      <Box sx={{ p: 2, textAlign: 'center', color: 'white', minHeight: '200px' }}>
                        <Typography>Error loading video</Typography>
                      </Box>
                    }
                  >
                    <HorizontalVideo video={video as Video} />
                  </ErrorBoundary>
                </SwiperSlide>
              ))}
            </Swiper>
          </ErrorBoundary>
        </Box>
      ))}
    </ErrorBoundary>
  );
};
