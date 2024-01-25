import { Avatar, Box, Button, Rating, TextField, Typography } from '@mui/material';
import { useUserStore } from '../../../state/userStore';
import { SyntheticEvent, useContext, useState } from 'react';
import axios from 'axios';
import { api } from '../../../constants';
import { SnackbarContext } from '../../../App';
import { StarBorder } from '@mui/icons-material';
import { getCookie } from 'typescript-cookie';
import { SignalResponse } from '../../../types/response.types';
import { useGetVideos } from '../../../hooks/useGetVideos';

type AddReviewType = {
  show_id: number;
  blockedReviews?: boolean;
  refetch: () => void;
};

export const AddReviewField = ({ show_id, blockedReviews, refetch }: AddReviewType) => {
  const { avatarUrl, username, setUserData } = useUserStore();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const { showSnackbar } = useContext(SnackbarContext);
  const {refetch: refetchVideoState} = useGetVideos();

  const handleRatingChange = (event: SyntheticEvent<Element, Event>, value: number | null) => {
    if (value !== null) setRating(value);
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value);
  };

  const sendReviewBlockQuery = async (id: number, targetStatus: 'unlock' | 'lock') => {
    try {
      let shouldBeBlocked: number;
      if (targetStatus === 'unlock') {
        shouldBeBlocked = 0;
      } else {
        shouldBeBlocked = 1;
      }
      const response = await axios.post<SignalResponse>(
        `${api}/reviews/userReviews/blockReviews`,
        {
          id: id,
          targetStatus: shouldBeBlocked,
        },
        {
          headers: {
            Authorization: `Bearer ${getCookie('userToken')}`,
          },
        }
      );
      if (response.data.result === 'SUCCESS') {
        showSnackbar(`Ratings submission has been (un)locked.`, 'info');
        refetchVideoState();
      }
    } catch (error) {
      showSnackbar('Error while blocking reviews!', 'error');
    }
  };

  const handleReviewBlock = () => {
    if(blockedReviews) {
      sendReviewBlockQuery(show_id, 'unlock')
    }
    else {
      sendReviewBlockQuery(show_id, 'lock')
    }
  }

  const handleAddReview = async () => {
    try {
      let ratingValue;
      if (rating === 0) {
        ratingValue = null;
      } else {
        ratingValue = rating * 2;
      }
      const response = await axios.post(
        `${api}/reviews/userReviews/addReview`,
        {
          comment: comment,
          grade: ratingValue,
          show_id: show_id,
          username: username,
        },
        { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
      );
      if (response.status === 200) {
        refetch();
        setUserData(username)
        showSnackbar('Comment Added', 'success');
      }
    } catch (error) {
      showSnackbar('Error occured while trying to add review', 'error');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: { mobile: '100%', desktop: '50%' },
        gap: '1.5rem',
        mb: '1rem',
        mx: '1rem',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: '1rem', width: '100%' }}>
        <Avatar src={avatarUrl} sx={{ width: '3rem', height: '3rem' }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          <Box>
            <Typography color="white">Add your review</Typography>
            <Rating
              sx={{ color: 'white' }}
              emptyIcon={<StarBorder sx={{ color: 'white' }} />}
              precision={0.5}
              onChange={handleRatingChange}
              value={rating}
              readOnly={blockedReviews}
            />
          </Box>
          <TextField
            multiline
            fullWidth
            disabled={blockedReviews}
            placeholder={blockedReviews ? "You can't review this show" : 'Add your own comment'}
            rows={3}
            onChange={handleCommentChange}
            sx={{
              '&>div>fieldset': { borderColor: 'primary.600' },
              color: 'white',
            }}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
        <Button
          disabled={blockedReviews}
          variant="contained"
          sx={{ backgroundColor: 'primary.600', width: { desktop: '10rem', mobile: '50%' } }}
          onClick={handleAddReview}
        >
          Add Comment
        </Button>
        {Number(getCookie('userAccountType')) === 2 ||
          Number(getCookie('userAccountType')) === 3 ? (
            <Button
              variant="contained"
              sx={{ backgroundColor: 'primary.600', width: { desktop: '10rem', mobile: '50%' } }}
              onClick={handleReviewBlock}
            >
              {blockedReviews ? 'Unblock Reviews' : 'Block Reviews'}
            </Button>
          ) : null}
      </Box>
    </Box>
  );
};
