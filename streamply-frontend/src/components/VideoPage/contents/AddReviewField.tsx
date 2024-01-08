import { Avatar, Box, Button, Rating, TextField, Typography } from '@mui/material';
import { useUserStore } from '../../../state/userStore';
import { SyntheticEvent, useContext, useState } from 'react';
import axios from 'axios';
import { api } from '../../../constants';
import { SnackbarContext } from '../../../App';
import { StarBorder } from '@mui/icons-material';
import { getCookie } from 'typescript-cookie';

type AddReviewType = {
  show_id: number;
  blockedReviews?: boolean;
  refetch: () => void;
};

export const AddReviewField = ({ show_id, blockedReviews, refetch }: AddReviewType) => {
  const { avatarUrl, username } = useUserStore();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const { showSnackbar } = useContext(SnackbarContext);

  const handleRatingChange = (event: SyntheticEvent<Element, Event>, value: number | null) => {
    if (value !== null) setRating(value);
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value);
  };

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
      <Button
        disabled={blockedReviews}
        variant="contained"
        sx={{ backgroundColor: 'primary.600', width: '8rem' }}
        onClick={handleAddReview}
      >
        Add Comment
      </Button>
    </Box>
  );
};
