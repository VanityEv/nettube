import { useEffect, useState } from 'react';
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

export const TopMovies = ({ mainMovie, topMovies, autoplayTrailer }: TopMoviesProps) => {
  const { videos } = useVideosStore();
  const displayVideos = videos.slice(0, 10);
  const titles = videos.map(video => video.title).slice(0, 10);
  const posters = videos.map(video => video.thumbnail).slice(0, 10);
  // const movie = [
  //   'https://wallpapercave.com/wp/wp3982534.jpg',
  //   'https://s.studiobinder.com/wp-content/uploads/2018/02/Ultimate-Guide-To-Camera-Shots-Single-Shot.jpeg?resolution=2560,2',
  //   'https://www.careersinfilm.com/wp-content/uploads/2019/05/wide-shot-days-of-heaven.jpg',
  // ];

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
              movies={videos.slice(0, 10)}
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
