import { Box, Typography } from '@mui/material';
import { Video } from '../../store/videos.types';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { getRatingColor } from '../../helpers/getRatingColors';
import { useUserStore } from '../../state/userStore';

export const SingleVideo = ({ video }: { video: Video }) => {
  const { likes } = useUserStore();
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'end',
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: '2rem', mb: '1rem' }}>
          <Typography
            variant="body1"
            color="white"
            sx={{
              fontSize: '14px',
              textTransform: 'capitalize',
            }}
          >
            {video.title}
          </Typography>
          <Typography
            variant="body1"
            color={getRatingColor(video.grade)}
            sx={{
              fontSize: '12px',
              textTransform: 'capitalize',
            }}
          >
            Rating: {video.grade}
          </Typography>
        </Box>
        {likes.includes(video.id) ? (
          <Favorite color="error" sx={{ mr: '2rem', mb: '1rem' }} />
        ) : (
          <FavoriteBorder color="error" sx={{ mr: '2rem', mb: '1rem' }} />
        )}
      </Box>
    </Box>
  );
};
