import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { Rating, Box, IconButton } from '@mui/material';
import { Delete, ExpandMore } from '@mui/icons-material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import useHttp from '../hooks/useHttp';
import { useCallback, useEffect, useState } from 'react';

export type LikeEntry = {
  id: number;
  thumbnail: string;
  title: string;
  alt: string;
};
type ReviewEntry = {
  comment: string;
  grade: number;
  title: string;
};

function UserProfileAccordion() {
  const { sendRequest } = useHttp();
  const [likesData, setLikesData] = useState<LikeEntry[] | []>([]);
  const [reviewsData, setReviewsData] = useState<ReviewEntry[] | []>([]);
  const sendReviewsQuery = useCallback(async () => {
    const username = localStorage.getItem('username');
    const response = await sendRequest({
      method: 'GET',
      endpoint: `/reviews/userReviews/${username}`,
    });
    if (response.result === 'SUCCESS') {
      setReviewsData(response.data);
    }
  }, []);

  const sendLikesQuery = useCallback(async () => {
    const username = localStorage.getItem('username');
    const response = await sendRequest({
      method: 'GET',
      endpoint: `/user/userLikes/${username}`,
    });
    if (response.result === 'SUCCESS') {
      setLikesData(response.data);
    }
  }, []);

  const sendDeleteLikeQuery = async (show_title: string) => {
    const username = localStorage.getItem('username');
    const response = await sendRequest({
      method: 'POST',
      body: {
        username: username,
        show_title: show_title,
      },
      endpoint: `/user/deleteLike`,
    });
    if (response.result === 'SUCCESS') {
      sendLikesQuery();
    }
  };

  useEffect(() => {
    sendReviewsQuery();
    sendLikesQuery();
  }, [sendReviewsQuery, sendLikesQuery]);

  const handleDelete = (show_title: string) => {
    sendDeleteLikeQuery(show_title);
  };

  return (
    <Box sx={{ flexGrow: 3 }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
          <Typography>Liked shows</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid2>
            {likesData.map((like, id) => (
              <Grid2
                key={like.title.toLowerCase() + id}
                mobile={12}
                desktop={6}
                sx={{
                  mx: 'auto',
                  width: 200,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pl: '20px',
                  boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)',
                }}
              >
                <Box display="flex" flexDirection="row" alignItems="center">
                  <img src={like.thumbnail} alt={like.alt} className="review-thumbnail" />
                  <Typography sx={{ pl: '30px', letterSpacing: '1px', fontWeight: 700 }}>{like.title}</Typography>
                </Box>
                <IconButton
                  sx={{ mr: '30px', fontSize: '12px' }}
                  onClick={() => {
                    handleDelete(like.title);
                  }}
                >
                  <Delete />
                  Delete
                </IconButton>
              </Grid2>
            ))}
          </Grid2>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel2a-content" id="panel2a-header">
          <Typography>Comments & Reviews</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid2>
            {reviewsData.map((review, id) => (
              <Grid2
                key={review.title.toLowerCase() + id}
                sx={{
                  justifyContent: 'left',
                }}
              >
                <h4 style={{ margin: 0, textAlign: 'left' }}>{review.title}</h4>
                <Rating name="read-only" value={review.grade / 2} precision={0.5} readOnly />
                <Typography sx={{ textAlign: 'left' }}>{review.comment}</Typography>
              </Grid2>
            ))}
          </Grid2>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
export default UserProfileAccordion;
