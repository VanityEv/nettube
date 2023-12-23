import { Box, Typography } from '@mui/material';
import { useGetReviews } from '../../../hooks/useGetReviews';
import { Video } from '../../../store/videos.types';
import { SingleReview } from './SingleReview';

export const ShowReviewList = ({ video }: { video: Video }) => {
  const { data, isLoading, error } = useGetReviews(video.id);

  if (isLoading) {
    return <Typography color="white">Loading...</Typography>;
  }
  if (error) {
    return <Typography color="white">Error: {error.message}</Typography>;
  }

  if (data?.reviews.length === 0) {
    return <Typography color="white">This show has no reviews yet.</Typography>;
  }

  return (
    <Box>
      {data?.reviews.map(review => (
        <SingleReview review={review} />
      ))}
    </Box>
  );
};
