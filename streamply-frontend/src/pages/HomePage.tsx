import { Box } from '@mui/material';
import { TopMovies } from '../components/MainImage/TopMovies';
import { Video } from '../store/videos.types';
import { MoviesCarousel } from '../components/MainImage/MoviesCarousel';
import { GenreBrowser } from '../components/GenreBrowser/GenreBrowser';

const posters = [
  'https://m.media-amazon.com/images/M/MV5BN2Y0NGI2NjktNWI0Yy00OTAwLWI4MTAtNjY1NDBlN2IxZTEwXkEyXkFqcGdeQXVyMTI0NTE1Njg4._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BNzQ1ODUzYjktMzRiMS00ODNiLWI4NzQtOTRiN2VlNTNmODFjXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BZWYzOGEwNTgtNWU3NS00ZTQ0LWJkODUtMmVhMjIwMjA1ZmQwXkEyXkFqcGdeQXVyMjkwOTAyMDU@._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjYi00OGExLWE2YzgtOGRmYjAxZTU3NzBiXkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
];

function HomePage() {
  const testVideo: Pick<Video, 'id' | 'title' | 'descr'> = {
    id: 1,
    title: 'Test title',
    descr: 'test test test',
  };
  const titles = ['Test1', 'Test2', 'Test3', 'Test4', 'Test5'];

  return (
    <>
      <TopMovies mainMovie={testVideo} topMovies={posters} />
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
          movies={posters}
          titles={titles}
          withNavigation
          posterVariant="overlay"
          carouselTitle="Most Popular Movies"
          carouselTitleTextVariant="h4"
        />
        <MoviesCarousel
          movies={posters}
          titles={titles}
          withNavigation
          posterVariant="overlay"
          carouselTitle="Top Watched Series"
          carouselTitleTextVariant="h4"
        />
        <MoviesCarousel
          movies={posters}
          titles={titles}
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
