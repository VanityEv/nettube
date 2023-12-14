import { Box, Button, ButtonBase, Stack, Typography, TypographyVariant } from '@mui/material';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import { Navigation, Scrollbar, Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Poster } from './Poster';
import { useState } from 'react';
import { Video } from '../../store/videos.types';

type MoviesCarouselProps = {
  movies: Video[];
  selectedMovie?: string;
  withNavigation?: boolean;
  slidesPerView?: number;
  posterVariant?: 'caption' | 'overlay';
  carouselTitle?: string;
  carouselTitleTextVariant?: TypographyVariant;
};

export const MoviesCarousel = ({
  movies,
  selectedMovie,
  withNavigation,
  slidesPerView = 5.5,
  posterVariant = 'caption',
  carouselTitle,
  carouselTitleTextVariant = 'h2',
}: MoviesCarouselProps) => {
  const [isActive, setActive] = useState(selectedMovie);

  const handleActiveChange = (title: string) => {
    setActive(title);
    if (selectedMovie) {
      sessionStorage.setItem('selectedMovie', title);
      sessionStorage.setItem('selectedMovieBackground', selectedMovie);
    }
  };
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        justifyContent: 'end',
        gap: '3rem',
      }}
    >
      {carouselTitle && (
        <Typography variant={carouselTitleTextVariant} color="white" sx={{ ml: '2rem', fontWeight: '700' }}>
          {carouselTitle}
        </Typography>
      )}
      <Box sx={{ width: '100%' }}>
        <Swiper
          modules={[Navigation, Scrollbar, Autoplay]}
          slidesPerView={slidesPerView}
          loop
          draggable
          navigation={withNavigation}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}
        >
          {movies.map((movie, index) => (
            <SwiperSlide key={`hot-movie-${movie.title}`}>
              <Poster
                posterURL={movie.thumbnail}
                title={movie.title}
                variant={posterVariant}
                active={isActive === movie.title}
                setActive={handleActiveChange}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
};
