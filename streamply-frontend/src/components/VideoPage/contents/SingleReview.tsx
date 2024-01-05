import { Avatar, Box, Button, Divider, Typography } from '@mui/material';
import { convertDate } from '../../../helpers/convertDate';
import { useEffect, useState } from 'react';
import { SingleUserReview } from '../../../hooks/useGetUserReviews';
import { Review } from '../../../types/reviews.types';
import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../../../constants';
import { AvatarResponse } from '../../../hooks/useGetUserInfo';

export const SingleReview = ({ review, profileView }: { review: SingleUserReview | Review; profileView?: boolean }) => {
  const maxDefaultCommentLength = review.comment.length <= 200 ? review.comment.length : 200;
  const [showFullComment, setShowFullComment] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const fetchAvatar = async (username: string) => {
    try {
      const response = await axios.get<AvatarResponse>(`${SERVER_ADDR}:${SERVER_PORT}/user/getAvatar/${username}`);

      if (response.status === 200) {
        setAvatarUrl(`${SERVER_ADDR}:${SERVER_PORT}${response.data.result}`);
      } else {
        return;
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    fetchAvatar((review as Review).username);
  }, []);

  const handleContinueReading = () => {
    setShowFullComment(true);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        ml: '1.5rem',
        gap: '0.75rem',
        '&>div>p.comment': { color: 'white' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
        {!profileView && <Avatar src={avatarUrl} />}
        <Typography fontWeight={700} color="primary.600">
          {profileView && 'title' in review ? review.title : (review as Review).username}
        </Typography>
        <Typography fontWeight={700} color="white">
          •
        </Typography>
        <Typography fontWeight={300} fontSize={14} color="white">
          {convertDate(review.comment_date)}
        </Typography>
      </Box>
      {review.grade ? <Typography sx={{ color: 'white' }}>Reviewed with grade {review.grade} / 10</Typography> : null}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Typography className="comment">
          {showFullComment
            ? review.comment
            : `${review.comment.substring(0, maxDefaultCommentLength)}${
                maxDefaultCommentLength < review.comment.length ? '...' : ''
              }`}
        </Typography>
        {review.comment.length > 200 && !showFullComment && (
          <Button
            variant="text"
            sx={{ color: 'primary.600', '&:hover': { backgroundColor: 'transparent' } }}
            onClick={handleContinueReading}
          >
            Continue Reading
          </Button>
        )}
        {showFullComment && (
          <Button
            variant="text"
            sx={{ color: 'primary.600', '&:hover': { backgroundColor: 'transparent' } }}
            onClick={() => setShowFullComment(false)}
          >
            Collapse
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: '1rem' }} />
    </Box>
  );
};
