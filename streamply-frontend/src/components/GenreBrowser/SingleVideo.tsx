import { Box, Rating, Typography } from '@mui/material';
import { Video } from '../../store/videos.types';
import { Favorite } from '@mui/icons-material';

export const SingleVideo = ({ video }: { video: Video }) => {
  return (
    <Box
      sx={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(0, 0, 0, 0.99)), url(${video.thumbnail})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        height: '400px',
        aspectRatio: '2 / 3',
        width: 'auto',
        display: 'flex',
        alignItems: 'end',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: '2rem', mb: '1rem' }}>
          <Typography
            variant="body1"
            color="white"
            sx={{
              fontSize: '12px',
              textTransform: 'uppercase',
            }}
          >
            {video.title}
          </Typography>
          <Typography
            variant="body1"
            color="white"
            sx={{
              fontSize: '12px',
              textTransform: 'capitalize',
            }}
          >
            Rating: {video.grade} / 10
          </Typography>
        </Box>
        <Favorite color="error" sx={{ mr: '2rem' }} />
      </Box>
    </Box>
  );
};
