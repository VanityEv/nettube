import { Box, Typography } from '@mui/material';
import { Video } from '../../../types/videos.types';

export const MoreInformation = ({ video }: { video: Video }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: { xs: '1rem', sm: '2rem' },
        ml: '1rem',
        '& p': { color: 'white', fontSize: '18px' },
      }}
    >
      <Box>
        <Typography>Title: {video.title}</Typography>
      </Box>
      <Box>
        <Typography>Director: {video.director}</Typography>
      </Box>
      <Box>
        <Typography>Production year: {video.production_year}</Typography>
      </Box>
      <Box>
        <Typography>Production country: {video.production_country}</Typography>
      </Box>
      <Box>
        <Typography>Genre: {video.genre}</Typography>
      </Box>
      <Box>
        <Typography>Average grade: {video.grade}</Typography>
      </Box>
      <Box>
        <Typography>Reviews count: {video.reviews_count}</Typography>
      </Box>
    </Box>
  );
};
