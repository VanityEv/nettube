import { Box, useMediaQuery, useTheme } from '@mui/material';
import { TopMovies } from '../components/MainImage/TopMovies';
import { MoviesCarousel } from '../components/MainImage/MoviesCarousel';
import { GenreBrowser } from '../components/GenreBrowser/GenreBrowser';
import { useVideosStore } from '../state/videosStore';
import { useUserStore } from '../state/userStore';
import { MovieSuggestions } from '../components/MovieSuggestions/MovieSuggestions';
import { useGetMockData } from '../hooks/useGetMockData';
import { ContinueWatching } from '../components/ContinueWatching/ContinueWatching';

function HomePage() {
  const { popularMovies, popularSeries, videos } = useVideosStore();
  const { likes } = useUserStore();
  const watchlist = videos.filter(video => likes.includes(video.id));
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  const isTablet = useMediaQuery(theme.breakpoints.down('tablet'));

  return (
    <>
      <TopMovies />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: 'secondary.400',
          display: 'flex',
          flexDirection: 'column',
          gap: '5rem',
          pt: '5rem',
        }}
      >
        <MoviesCarousel
          movies={popularMovies}
          withNavigation
          slidesPerView={isTablet ? 1 : isMobile ? 2 : 6.5}
          posterVariant="overlay"
          carouselTitle="Most Popular Movies"
          carouselTitleTextVariant="h4"
          withLink
        />
        <MoviesCarousel
          movies={popularSeries}
          slidesPerView={isTablet ? 1 : isMobile ? 2 : 6.5}
          withNavigation
          posterVariant="overlay"
          carouselTitle="Top Watched Series"
          carouselTitleTextVariant="h4"
          withLink
        />
        <MovieSuggestions />
        <ContinueWatching/>
        {likes && (
          <MoviesCarousel
            movies={watchlist}
            slidesPerView={isTablet ? 1 : isMobile ? 2 : 5}
            withNavigation
            posterVariant="overlay"
            carouselTitle="Your Watchlist"
            carouselTitleTextVariant="h4"
            withLink
          />
        )}
        <GenreBrowser />
      </Box>
    </>
  );
}

export default HomePage;
