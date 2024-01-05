import { Video } from '../../types/videos.types';
import styled from 'styled-components';
import { Box, Button, Grid, Typography } from '@mui/material';
import { MoviesCarousel } from './MoviesCarousel';
import { useVideosStore } from '../../state/videosStore';
import { createContext, useState } from 'react';
import { HeadPosterCarousel } from './HeadPosterCarousel';
import { PlayCircleOutline } from '@mui/icons-material';

type TopMoviesContextType = {
  selectedMovie: Video;
  setSelectedMovie: (selection: Video) => void;
};

export const TopMoviesContext = createContext({});

export const TopMovies = () => {
  const { videos } = useVideosStore();
  const displayVideos = videos.slice(0, 10);
  const [selectedMovie, setSelectedMovie] = useState<Video>(displayVideos[0]);

  const handleSelectedMovieChange = (selection: Video) => setSelectedMovie(selection);

  return (
    <Box sx={{ height: 'calc(100vh - 4.5rem)', display: { mobile: 'none', desktop: 'block', tablet: 'none' } }}>
      <Box
        sx={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(11, 8, 21, 0.99)), url(${selectedMovie.thumbnail})`,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          backgroundSize: 'cover',
          height: '100%',
          width: '100%',
        }}
      >
        <Grid container direction="row" sx={{ justifyContent: 'center', alignItems: 'center' }}>
          <Grid item sx={{ width: '40%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', ml: '4rem', gap: '3rem' }}>
              <Typography variant="h3" color="white">
                {selectedMovie.title}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1rem', width: '75%' }} color="white">
                {selectedMovie.descr}
              </Typography>
              <Button
                startIcon={<PlayCircleOutline />}
                href={`/video/${selectedMovie.id}`}
                variant="contained"
                sx={{ backgroundColor: 'primary.600', width: '20%' }}
              >
                Play
              </Button>
            </Box>
          </Grid>
          <Grid item sx={{ width: '60%', height: '100%' }}>
            <HeadPosterCarousel
              movies={displayVideos}
              carouselTitle="Hot Movies"
              carouselTitleTextVariant="h4"
              selectedMovie={selectedMovie}
              setSelectedMovie={handleSelectedMovieChange}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
