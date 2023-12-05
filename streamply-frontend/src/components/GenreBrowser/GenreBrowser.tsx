import { Box, Button, Typography } from '@mui/material';
import { GenreList } from './GenreList';
import { useExplorationStore } from '../../state/explorationStore';
import { GenreGrid } from './GenreGrid';
import { useState } from 'react';
import { useVideosStore } from '../../state/videosStore';

export const GenreBrowser = () => {
  const { selectedGenres } = useExplorationStore();
  const { videos } = useVideosStore();
  const [maxVideosToShow, setMaxVideos] = useState(10);
  const videosToDisplay =
    selectedGenres.length === 0 ? videos : videos.filter(video => selectedGenres.includes(video.genre));
  const videosSlice = videosToDisplay.slice(0, maxVideosToShow);

  const handleDisplayMore = (value: number) => {
    setMaxVideos(value);
  };

  return (
    <Box sx={{ width: '100%', height: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ ml: '2rem', fontWeight: '700', color: 'white' }}>
        Explore Genres
      </Typography>
      <GenreList />
      <GenreGrid videos={videosSlice} />
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '2rem', mb: '3rem' }}>
        {maxVideosToShow < videosToDisplay.length && (
          <Button
            key="display-more-button"
            variant="outlined"
            onClick={() => {
              handleDisplayMore(maxVideosToShow + 10);
            }}
          >
            Show More
          </Button>
        )}
        {videosToDisplay.length > 10 && (
          <Button
            key="collapse-button"
            variant="outlined"
            onClick={() => {
              handleDisplayMore(10);
            }}
          >
            Collapse
          </Button>
        )}
      </Box>
    </Box>
  );
};
