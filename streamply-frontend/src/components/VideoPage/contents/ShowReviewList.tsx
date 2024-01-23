import { Box, Button, Divider, IconButton, Typography } from '@mui/material';
import { useGetReviews } from '../../../hooks/useGetReviews';
import { Video } from '../../../types/videos.types';
import { SingleReview } from './SingleReview';
import { AddReviewField } from './AddReviewField';
import { Fragment, useContext, useState } from 'react';
import axios from 'axios';
import { SignalResponse } from '../../../types/response.types';
import { api } from '../../../constants';
import { getCookie } from 'typescript-cookie';
import { Delete } from '@mui/icons-material';
import { SnackbarContext } from '../../../App';

export const ShowReviewList = ({ video }: { video: Video }) => {
  const { data, isLoading, error, refetch } = useGetReviews(video.id);
  const [displayedReviews, setDisplayedReviews] = useState(10);
  const {showSnackbar} = useContext(SnackbarContext);

  const handleReviewDelete = async (id: number) => {
    try {
      const response = await axios.post<SignalResponse>(
        `${api}/reviews/userReviews/removeReview`,
        { id: id },
        { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
      );
      if (response.data.result === 'SUCCESS') {
        showSnackbar('Review deleted', 'success');
        refetch();
      }
    } catch (error) {
      showSnackbar('Error while deleting review', 'error');
    }
  };

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
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <AddReviewField blockedReviews={!!video.blocked_reviews} show_id={video.id} refetch={refetch} />
        <Typography color="white">This show has no reviews yet.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <AddReviewField blockedReviews={!!video.blocked_reviews} show_id={video.id} refetch={refetch} />
      {data?.reviews.slice(0, displayedReviews).map(review => (
        <Fragment key={`review-${review.id}`}>
          <Box sx={{ display: 'flex', flexDirection: {mobile:'column', desktop: 'row'}, gap: '2rem', justifyContent:'space-between' }}>
            <SingleReview review={review} />
            {(Number(getCookie('userAccountType')) === 2 || Number(getCookie('userAccountType')) === 3) && (
              <IconButton onClick={() => handleReviewDelete(review.id)}>
                <Delete sx={{ color: 'white' }} />
                <Typography fontWeight={500} color="white">
                  Delete review
                </Typography>
              </IconButton>
            )}
          </Box>
          <Divider sx={{ my: '1rem' }} />
        </Fragment>
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
