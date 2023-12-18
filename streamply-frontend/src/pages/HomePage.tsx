import { Box } from '@mui/material';
import { TopMovies } from '../components/MainImage/TopMovies';
import { MoviesCarousel } from '../components/MainImage/MoviesCarousel';
import { GenreBrowser } from '../components/GenreBrowser/GenreBrowser';
import { useVideosStore } from '../state/videosStore';
import { useUserStore } from '../state/userStore';

const posters = [
  'https://m.media-amazon.com/images/M/MV5BN2Y0NGI2NjktNWI0Yy00OTAwLWI4MTAtNjY1NDBlN2IxZTEwXkEyXkFqcGdeQXVyMTI0NTE1Njg4._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BNzQ1ODUzYjktMzRiMS00ODNiLWI4NzQtOTRiN2VlNTNmODFjXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BZWYzOGEwNTgtNWU3NS00ZTQ0LWJkODUtMmVhMjIwMjA1ZmQwXkEyXkFqcGdeQXVyMjkwOTAyMDU@._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjYi00OGExLWE2YzgtOGRmYjAxZTU3NzBiXkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
];

function HomePage() {
  const { popularMovies, popularSeries, videos } = useVideosStore();
  const { likes } = useUserStore();
  const watchlist = videos.filter(video => likes.includes(video.id));

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
          slidesPerView={7.5}
          posterVariant="overlay"
          carouselTitle="Most Popular Movies"
          carouselTitleTextVariant="h4"
        />
        <MoviesCarousel
          movies={popularSeries}
          slidesPerView={7.5}
          withNavigation
          posterVariant="overlay"
          carouselTitle="Top Watched Series"
          carouselTitleTextVariant="h4"
        />
        <MoviesCarousel
          movies={watchlist}
          slidesPerView={8}
          withNavigation
          posterVariant="overlay"
          carouselTitle="Your Watchlist"
          carouselTitleTextVariant="h4"
        />
        <GenreBrowser />
      </Box>
    </>
  );
}

export default HomePage;
