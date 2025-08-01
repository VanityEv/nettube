import { Video } from '../../types/videos.types';
import { Box, Button, Typography } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import { createContext, useState } from 'react';
import { HeadPosterCarousel } from './HeadPosterCarousel';
import { PlayCircleOutline } from '@mui/icons-material';
import { toKebabCase } from '../../helpers/convertToKebabCase';
import { api } from '../../constants';
import { safeArray, safeString } from '../../helpers/safeData';

export const TopMoviesContext = createContext({});

export const TopMovies = () => {
  const { videos } = useAppSelector(state => state.videos);

  // Safe handling of videos array
  const safeVideos = safeArray(videos) as Video[];
  const validVideos = safeVideos.filter(video => video && typeof video.views === 'number');
  const sortedVideos = validVideos.sort((a, b) => (b.views || 0) - (a.views || 0));
  const displayVideos = sortedVideos.slice(0, 10);

  // Safe default movie selection
  const defaultMovie = displayVideos.length > 0 ? displayVideos[0] : null;
  const [selectedMovie, setSelectedMovie] = useState<Video | null>(defaultMovie);

  // If no movies available, don't render anything
  if (!selectedMovie || displayVideos.length === 0) {
    return null;
  }

  const handleSelectedMovieChange = (selection: Video) => setSelectedMovie(selection);

  // Safe thumbnail URL handling - prefer cinematic thumbnail for hero display
  const cinematicUrl = safeString(selectedMovie.cinematic_thumbnail);
  const thumbnailUrl = safeString(selectedMovie.thumbnail);
  const url =
    cinematicUrl ||
    (thumbnailUrl.includes('http')
      ? thumbnailUrl
      : `${api}/images/main-display/${toKebabCase(safeString(selectedMovie.title, 'unknown'))}.jpg`);

  return (
    <Box sx={{ height: 'calc(100vh - 4.5rem)', display: { mobile: 'none', desktop: 'block', tablet: 'none' } }}>
      <Box
        sx={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(11, 8, 21, 0.99)), url(${url})`,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          backgroundSize: 'cover',
          height: '100%',
          width: '100%',
        }}
      >
        {' '}
        <Box
          sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: '100%' }}
        >
          <Box sx={{ width: '40%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                ml: '4rem',
                gap: '3rem',
                justifyContent: 'center',
                minHeight: '200px',
              }}
            >
              <Typography variant="h3" color="white">
                {selectedMovie.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontSize: '1rem', width: '75%', minHeight: '120px', display: 'flex', alignItems: 'flex-start' }}
                color="white"
              >
                {selectedMovie.descr}
              </Typography>
              <Button
                startIcon={<PlayCircleOutline />}
                href={
                  selectedMovie.type === 'series'
                    ? `/series/${toKebabCase(selectedMovie.title)}/season/1/episode/1`
                    : `/movie/${toKebabCase(selectedMovie.title)}`
                }
                variant="contained"
                sx={{ backgroundColor: 'primary.600', width: '20%' }}
              >
                Play
              </Button>
            </Box>
          </Box>
          <Box sx={{ width: '60%', height: '100%' }}>
            <HeadPosterCarousel
              movies={displayVideos}
              carouselTitle="Hot Movies"
              carouselTitleTextVariant="h4"
              selectedMovie={selectedMovie}
              setSelectedMovie={handleSelectedMovieChange}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
