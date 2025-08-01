import { Box, Typography } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { HorizontalVideo } from '../../VideoViews/HorizontalVideo';

export const Watchlist = () => {
  const { likes } = useAppSelector(state => state.user);
  const { videos } = useAppSelector(state => state.videos);
  const videosInWatchlist = videos.filter(video => likes.includes(video.id));

  return (
    <>
      <Typography variant="h6" fontWeight="600" color="white" sx={{ mb: '2rem' }}>
        Your Saved Movies & Series
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '2rem' }}>
        {videosInWatchlist.map(video => (
          <HorizontalVideo key={`watchlist-${video.id}`} video={video} />
        ))}
      </Box>
    </>
  );
};
