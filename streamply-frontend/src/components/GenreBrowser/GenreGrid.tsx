import { Box } from '@mui/material';
import { SingleVideo } from '../VideoViews/SingleVideo';
import { Video } from '../../types/videos.types';

export const GenreGrid = ({ videos }: { videos: Video[] }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        width: '100%',
        height: 'auto',
        flexWrap: 'wrap',
        p: 3,
        justifyContent: 'center',
      }}
    >
      {videos.map(video => (
        <SingleVideo video={video} key={`video-${video.id}`} />
      ))}
    </Box>
  );
};
