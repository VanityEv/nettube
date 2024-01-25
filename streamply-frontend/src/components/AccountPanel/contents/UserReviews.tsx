import { Divider, Grid, Typography } from '@mui/material';
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
    <Grid container>
      {data?.reviews.map((review, idx) => (
        <Grid item desktop={6} mobile={12} key={`${username}-review-${review.title}-${idx}`}>
          <SingleReview profileView review={review} />
          <Divider sx={{ my: '1rem' }} />
        </Grid>
      ))}
    </Grid>
  );
};
