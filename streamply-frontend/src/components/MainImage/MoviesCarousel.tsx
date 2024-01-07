import { Box, Button, ButtonBase, Stack, Typography, TypographyVariant } from '@mui/material';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import { Navigation, Scrollbar, Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Poster } from './Poster';
import { Fragment, ReactNode, cloneElement, useState } from 'react';
import { Video } from '../../types/videos.types';
import { ConditionalWrapper } from '../ConditionalWrapper';
import { Link } from 'react-router-dom';
import { toKebabCase } from '../../helpers/convertToKebabCase';
import { LinkedSlide } from '../LinkedSlide';
import { StatefulSlide } from '../StatefulSlide';

type MoviesCarouselProps = {
  movies: Video[];
  selectedMovie?: string;
  withNavigation?: boolean;
  slidesPerView?: number;
  posterVariant?: 'caption' | 'overlay';
  carouselTitle?: string;
  carouselTitleTextVariant?: TypographyVariant;
  withLink?: boolean;
};

export const MoviesCarousel = ({
  movies,
  selectedMovie,
  withNavigation,
  slidesPerView = 5.5,
  carouselTitle,
  carouselTitleTextVariant = 'h2',
  withLink = false,
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
          centeredSlides
          navigation={withNavigation}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}
        >
          {movies.map((movie, idx) => (
            <SwiperSlide key={`movie-${movie.title}-${movie.id}-${idx}`}>
              {withLink ? (
                <LinkedSlide movie={movie} />
              ) : (
                <StatefulSlide movie={movie} isActive={isActive === movie.title} setActive={handleActiveChange} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
};
