import { Avatar, Box, Button, Typography } from '@mui/material';
import { convertDate } from '../../../helpers/convertDate';
import { useEffect, useState } from 'react';
import { SingleUserReview } from '../../../hooks/useGetUserReviews';
import { Review } from '../../../types/reviews.types';
import axios from 'axios';
import { api } from '../../../constants';
import { AvatarResponse } from '../../../hooks/useGetUserInfo';
import DOMPurify from 'dompurify';

export const SingleReview = ({ review, profileView }: { review: SingleUserReview | Review; profileView?: boolean }) => {
  const maxDefaultCommentLength = review.comment.length <= 200 ? review.comment.length : 200;
  const [showFullComment, setShowFullComment] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const fetchAvatar = async (username: string) => {
    try {
      const response = await axios.get<AvatarResponse>(`${api}/user/getAvatar/${username}`);

      if (response.status === 200) {
        // Check if avatar was found and is a valid URL
        if (response.data.result === 'AVATAR_NOT_FOUND') {
          setAvatarUrl('');
          return;
        }
        // Use the full B2 signed URL directly (don't prefix with api)
        setAvatarUrl(response.data.result);
      } else {
        return;
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    fetchAvatar((review as Review).username);
  }, [review]);

  const handleContinueReading = () => {
    setShowFullComment(true);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        '&>div>p.comment': { color: 'white' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
        {!profileView && <Avatar src={avatarUrl} sx={{ width: 40, height: 40 }} />}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Typography fontWeight={600} color="primary.600" fontSize="1rem">
            {profileView && 'title' in review ? review.title : (review as Review).username}
          </Typography>
          <Typography fontWeight={300} fontSize={12} color="rgba(255, 255, 255, 0.7)">
            {convertDate(review.comment_date)}
          </Typography>
        </Box>
      </Box>

      {review.grade ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'primary.600',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem',
            }}
          >
            {Number(review.grade).toFixed(1)}
          </Box>
          <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>out of 10</Typography>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Typography
          className="comment"
          sx={{
            color: 'white',
            lineHeight: 1.6,
            fontSize: '0.95rem',
          }}
          dangerouslySetInnerHTML={{
            __html: showFullComment
              ? DOMPurify.sanitize(review.comment)
              : DOMPurify.sanitize(
                  `${review.comment.substring(0, maxDefaultCommentLength)}${
                    maxDefaultCommentLength < review.comment.length ? '...' : ''
                  }`
                ),
          }}
        />
        {review.comment.length > 200 && !showFullComment && (
          <Button
            variant="text"
            size="small"
            sx={{
              color: 'primary.600',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
              alignSelf: 'flex-start',
              textTransform: 'none',
            }}
            onClick={handleContinueReading}
          >
            Continue Reading
          </Button>
        )}
        {showFullComment && (
          <Button
            variant="text"
            size="small"
            sx={{
              color: 'primary.600',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
              alignSelf: 'flex-start',
              textTransform: 'none',
            }}
            onClick={() => setShowFullComment(false)}
          >
            Show Less
          </Button>
        )}
      </Box>
    </Box>
  );
};
