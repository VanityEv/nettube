import { Box, Typography, TypographyVariant } from '@mui/material';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import { Navigation, Scrollbar, Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Video } from '../../store/videos.types';
import { StatefulSlide } from '../StatefulSlide';

type MoviesCarouselProps = {
  movies: Video[];
  selectedMovie: Video;
  setSelectedMovie: (video: Video) => void;
  carouselTitle?: string;
  carouselTitleTextVariant?: TypographyVariant;
  withLink?: boolean;
};

export const HeadPosterCarousel = ({
  movies,
  carouselTitle,
  carouselTitleTextVariant = 'h4',
  selectedMovie,
  setSelectedMovie,
}: MoviesCarouselProps) => {
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
          slidesPerView={5.5}
          loop
          draggable
          navigation={false}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}
        >
          {movies.map((movie, idx) => (
            <SwiperSlide key={`movie-${movie.title}-${movie.id}-${idx}`}>
              <StatefulSlide
                movie={movie}
                isActive={selectedMovie.title === movie.title}
                setActive={() => setSelectedMovie(movie)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
};
