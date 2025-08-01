import { Box, useMediaQuery, useTheme } from '@mui/material';
import { TopMovies } from '../components/MainImage/TopMovies';
import { MoviesCarousel } from '../components/MainImage/MoviesCarousel';
import { GenreBrowser } from '../components/GenreBrowser/GenreBrowser';
import { useAppSelector } from '../store/hooks';
import { MovieSuggestions } from '../components/MovieSuggestions/MovieSuggestions';
import { ContinueWatching } from '../components/ContinueWatching/ContinueWatching';
import SafeVideoList from '../components/SafeVideoList';
import { safeArray, isValidArray } from '../helpers/safeData';
import { Video } from '../types/videos.types';

function HomePage() {
  const { popularMovies, popularSeries, videos } = useAppSelector(state => state.videos);
  const { likes } = useAppSelector(state => state.user);
  const watchlist = safeArray(videos).filter((video: any) => likes.includes(video.id)) as Video[];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  const isTablet = useMediaQuery(theme.breakpoints.down('tablet'));

  // Check if we have any data at all
  const hasAnyData =
    isValidArray(safeArray(videos)) || isValidArray(safeArray(popularMovies)) || isValidArray(safeArray(popularSeries));

  return (
    <>
      <TopMovies />
      {!hasAnyData && (
        <SafeVideoList
          videos={[]}
          emptyStateTitle="Welcome to Streamply!"
          emptyStateDescription="The video database is currently empty. Videos will appear here once they are added to the system."
        />
      )}
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
        <ContinueWatching />
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
