import { Box, Button, Zoom } from '@mui/material';
import { useVideosStore } from '../../state/videosStore';
import { useExplorationStore } from '../../state/explorationStore';
import ScrollContainer from 'react-indiana-drag-scroll';

export const GenreList = () => {
  const { genres } = useVideosStore();
  const { selectedGenres, setGenres } = useExplorationStore();
  const handleGenreClick = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setGenres(selectedGenres.filter(selectedGenre => selectedGenre !== genre));
    } else {
      setGenres([...selectedGenres, genre]);
    }
  };

  return (
    <ScrollContainer
      style={{
        display: 'flex',
        width: 'auto',
        gap: '2rem',
        overflow: 'hidden',
        paddingBottom: '1rem',
        paddingTop: '1rem',
      }}
    >
      {genres.map(genre => (
        <Zoom in={Boolean(genre)}>
          <Button
            key={`display-${genre}`}
            variant={selectedGenres.includes(genre) ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: selectedGenres.includes(genre) ? 'primary.600' : 'transparent',
              minWidth: 'auto',
            }}
            onClick={() => {
              handleGenreClick(genre);
            }}
          >
            {genre}
          </Button>
        </Zoom>
      ))}
    </ScrollContainer>
  );
};
