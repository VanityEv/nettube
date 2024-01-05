import { Box, Button, Typography } from '@mui/material';
import { useGetReviews } from '../../../hooks/useGetReviews';
import { Video } from '../../../types/videos.types';
import { SingleReview } from './SingleReview';
import { AddReviewField } from './AddReviewField';
import { useState } from 'react';

export const ShowReviewList = ({ video }: { video: Video }) => {
  const { data, isLoading, error, refetch } = useGetReviews(video.id);
  const [displayedReviews, setDisplayedReviews] = useState(10);

  const handleViewMore = () => {
    setDisplayedReviews(prev => prev + 10);
  };

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
      <AddReviewField show_id={video.id} refetch={refetch} />
      {data?.reviews.slice(0, displayedReviews).map(review => (
        <SingleReview key={`review-${review.id}`} review={review} />
      ))}
      {data?.reviews.length && data?.reviews.length > displayedReviews && (
        <Button
          variant="contained"
          sx={{ backgroundColor: 'primary.600', width: '8rem', mt: '1rem', ml: '1rem' }}
          onClick={handleViewMore}
        >
          Load More
        </Button>
      )}
    </Box>
  );
};
