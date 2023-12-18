import { Video } from '../../store/videos.types';
import styled from 'styled-components';
import { Box, Grid, Typography } from '@mui/material';
import { MoviesCarousel } from './MoviesCarousel';
import { useVideosStore } from '../../state/videosStore';

type TopMoviesProps = {
  mainMovie: Pick<Video, 'id' | 'title' | 'descr'>;
  topMovies: string[];
  autoplayTrailer?: boolean;
};

export const TrailerBackground = styled('div')`
  width: 100vw;
  height: calc(100vh - 4.5rem);
  background-size: cover;
`;

export const TopMovies = () => {
  const { videos } = useVideosStore();
  const displayVideos = videos.slice(0, 10);
  const titles = videos.map(video => video.title).slice(0, 10);
  const posters = videos.map(video => video.thumbnail).slice(0, 10);

  return (
    <Box sx={{ height: 'calc(100vh - 4.5rem)' }}>
      <Box
        sx={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(11, 8, 21, 0.99)), url(${videos[1].thumbnail})`,
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
                {videos[1].title}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1rem', width: '75%' }} color="white">
                {videos[1].descr}
              </Typography>
            </Box>
          </Grid>
          <Grid item sx={{ width: '60%', height: '100%' }}>
            <MoviesCarousel
              movies={displayVideos}
              selectedMovie={titles[0]}
              carouselTitle="Hot Movies"
              carouselTitleTextVariant="h4"
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
