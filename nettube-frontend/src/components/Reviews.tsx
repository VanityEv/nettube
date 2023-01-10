import { RemoveCircleOutline } from '@mui/icons-material';
import {
  Stack,
  Rating,
  Typography,
  Avatar,
  Divider,
  Grid,
  Paper,
  TextField,
  IconButton,
  useTheme,
} from '@mui/material';
import React, { SyntheticEvent, useState } from 'react';
import useHttp from '../hooks/useHttp';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchReviewsData } from '../store/reviews-actions';
import type { Review } from '../store/reviews.types';

type ReviewsProps = {
  reviews: Review[];
  showId: number;
};

type ReviewItemProps = Review & {
  onRemove: (id: number) => void;
};

/**
 * TODO: poprawić css do bloku komentarza bo dla mobile nie clipuje się w modalu
 * (dokładniej dłuższy tekst wychodzi poza paper) - BUG
 */

function ReviewItem(props: ReviewItemProps) {
  const { username, grade, comment, onRemove, id } = props;
  const currentAccType =
    localStorage.getItem('account_type') !== null ? parseInt(localStorage.getItem('account_type') as string) : 1;

  return (
    <Paper style={{ padding: '40px 20px', position: 'relative' }} elevation={4}>
      {(currentAccType === 2 || currentAccType === 3) && (
        <IconButton onClick={() => onRemove(id)} sx={{ position: 'absolute', right: '0', top: '0', padding: 1 }}>
          <RemoveCircleOutline />
        </IconButton>
      )}

      <Grid container wrap="nowrap" spacing={2}>
        <Grid item>
          <Avatar src="assets/images/avatar.png" />
        </Grid>
        <Grid
          sx={{
            justifyContent: 'left',
            paddingLeft: '12px',
          }}
        >
          <Typography variant="h5" style={{ margin: 0, textAlign: 'left' }}>
            {username}
          </Typography>
          <Rating name="read-only" value={grade / 2} precision={0.5} readOnly />
          <Typography sx={{ marginTop: '24px', textAlign: 'left' }}>{comment}</Typography>
        </Grid>
      </Grid>

      <Divider variant="fullWidth" style={{ margin: '30px 0' }} />
    </Paper>
  );
}

const Reviews = (props: ReviewsProps) => {
  const { reviews, showId } = props;
  const reviewsWithoutComments = reviews.filter(review => review.grade !== null);
  const [reviewValue, setReviewValue] = useState('');
  const videos = useAppSelector(state => state.videos.videos);
  const isBlocked = videos.filter(video => video.id === showId)[0].blocked_reviews === 1;
  const [rating, setRating] = useState(0);
  const { sendRequest } = useHttp();
  const currentUserName = useAppSelector(state => state.user.username);
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const response = await sendRequest({
        method: 'POST',
        endpoint: '/reviews/userReviews/addReview',
        body: {
          comment: reviewValue,
          grade: rating * 2,
          show_id: showId,
          username: currentUserName,
        },
      });
      if (response.result === 'SUCCESS') {
        dispatch(fetchReviewsData());
        setReviewValue('');
        setRating(0);
      }
    }
  };

  const handleReviewChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReviewValue(event.target.value);
  };

  const handleRatingChange = (event: SyntheticEvent<Element, Event>, value: number | null) => {
    if (value !== null) setRating(value);
  };

  const handleRemoveReview = async (id: number) => {
    const response = await sendRequest({
      method: 'POST',
      endpoint: '/reviews/userReviews/removeReview',
      body: {
        id: id,
      },
    });
    if (response.result === 'SUCCESS') {
      dispatch(fetchReviewsData());
    }
  };

  return (
    <Stack
      spacing={2}
      sx={{
        display: 'flex',
        width: '100%',
        textOverflow: 'clip',
        flexGrow: 1,
      }}
    >
      <Paper
        style={{
          padding: '40px 20px',
          backgroundColor: isBlocked ? theme.palette.action.disabledBackground : theme.palette.background.paper,
        }}
        elevation={4}
      >
        <Grid container wrap="nowrap" spacing={2}>
          <Grid item>
            <Avatar src="assets/images/avatar.png" />
          </Grid>
          <Grid
            sx={{
              justifyContent: 'left',
              paddingLeft: '12px',
            }}
          >
            <Typography variant="h5" style={{ margin: 0, textAlign: 'left' }}>
              You
            </Typography>
            <Rating precision={0.5} onChange={handleRatingChange} value={rating} readOnly={isBlocked} />
            <TextField
              id="standard-basic"
              label="Leave your review"
              variant="standard"
              fullWidth
              onKeyDown={handleKeyDown}
              onChange={handleReviewChange}
              value={reviewValue}
              sx={{
                marginTop: '12px',
              }}
              disabled={isBlocked}
            />
          </Grid>
        </Grid>
        <Divider variant="fullWidth" style={{ margin: '30px 0' }} />
      </Paper>

      {reviewsWithoutComments.map(item => (
        <ReviewItem onRemove={handleRemoveReview} {...item} key={item.id} />
      ))}
    </Stack>
  );
};

export default Reviews;
