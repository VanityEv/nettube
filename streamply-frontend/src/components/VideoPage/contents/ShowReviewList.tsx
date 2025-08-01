import { Box, Button, IconButton, Typography } from '@mui/material';
import { useGetReviews } from '../../../hooks/useGetReviews';
import { Video } from '../../../types/videos.types';
import { SingleReview } from './SingleReview';
import { AddReviewField } from './AddReviewFieldRedux';
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
  const { showSnackbar } = useContext(SnackbarContext);

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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              mb: '2rem',
              p: '1.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Render the complete review with proper comment */}
            <SingleReview review={review} />

            {/* Admin/Moderator delete button */}
            {(Number(getCookie('userAccountType')) === 2 || Number(getCookie('userAccountType')) === 3) && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '1rem' }}>
                <IconButton
                  onClick={() => handleReviewDelete(review.id)}
                  sx={{
                    color: 'error.main',
                    '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' },
                  }}
                >
                  <Delete />
                  <Typography fontWeight={500} color="error.main" sx={{ ml: '0.5rem' }}>
                    Delete review
                  </Typography>
                </IconButton>
              </Box>
            )}
          </Box>
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

// --- DOMPurify: Always sanitize user-generated HTML before rendering ---
// Example usage in review rendering:
// dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(review.comment) }}
//
// If using dangerouslySetInnerHTML anywhere, always sanitize with DOMPurify first.
