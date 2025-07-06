import { Box, Typography } from '@mui/material';
import { SingleReview } from '../../VideoPage/contents/SingleReview';
import { useGetUserReviews } from '../../../hooks/useGetUserReviews';
import { useUserStore } from '../../../state/userStore';

export const UserReviews = () => {
  const { username } = useUserStore();
  const { data, isLoading, error } = useGetUserReviews(username);

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
    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '2rem' }}>
      {data?.reviews.map((review, idx) => (
        <Box key={`${username}-review-${review.title}-${idx}`} sx={{ width: { xs: '100%', lg: '45%' } }}>
          <SingleReview profileView review={review} />
        </Box>
      ))}
    </Box>
  );
};
