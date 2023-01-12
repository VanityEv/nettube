import { useState } from 'react';
import { Box, Modal, Fade, Typography, Rating, ButtonGroup } from '@mui/material';
import { PlayCircle } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Video } from '../store/videos.types';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { Button } from '@mui/material';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import Reviews from './Reviews';
import { useNavigate } from 'react-router-dom';
import useHttp from '../hooks/useHttp';
import { fetchVideosData } from '../store/videos-actions';

export default function TransitionsModal({
  id,
  tier,
  title,
  type,
  genre,
  production_year,
  production_country,
  age_restriction,
  grade,
  reviews_count,
  alt,
  descr,
  thumbnail,
  blocked_reviews,
}: Video) {
  const reviews = useAppSelector(state => state.reviews.reviews);
  const selectedReviews = reviews.filter(review => {
    return review.show_id === id;
  });
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);
  const handleIsOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const handlePlay = () => {
    navigate('/watch', { state: { showId: id, title: title } });
  };
  const accountType = localStorage.getItem('account_type')
    ? parseInt(localStorage.getItem('account_type') as string)
    : 1;
  const { sendRequest } = useHttp();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : '70%',
    height: isMobile ? '90%' : '70%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: isMobile ? 2 : 4,
    objectFit: 'contain',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
  };

  const handleBlockReviews = async () => {
    const response = await sendRequest({
      method: 'POST',
      endpoint: '/reviews/userReviews/blockReviews',
      body: {
        id: id,
        isBlocked: blocked_reviews === 1 ? 0 : 1,
      },
    });
    if (response.result === 'SUCCESS') dispatch(fetchVideosData());
  };
  return (
    <>
      <PlayCircle onClick={handleIsOpen} />
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={isOpen}
        onClose={handleClose}
        closeAfterTransition
      >
        <Fade in={isOpen}>
          <Box sx={style}>
            <img style={{ flexGrow: 1, height: isMobile ? '50%' : 'auto' }} src={thumbnail} alt={alt} />
            <Box
              style={{
                padding: '1rem',
                overflowY: 'auto',
                columnGap: 2,
              }}
            >
              <Typography id="transition-modal-title" variant="h3" component="h2" textAlign="center">
                {title}
              </Typography>
              <Typography id="transition-modal-description" sx={{ mt: 2 }} textAlign="center">
                {descr}
              </Typography>
              <Typography gutterBottom variant="subtitle1" component="div" textAlign="center" sx={{ mt: 2 }}>
                Production type: {type === 'series' ? 'Series' : 'Movie'}
              </Typography>
              <Typography gutterBottom variant="subtitle1" component="div" textAlign="center">
                Genre: {genre}
              </Typography>
              <Typography gutterBottom variant="subtitle1" component="div" textAlign="center">
                Production year: {production_year}
              </Typography>
              <Typography gutterBottom variant="subtitle1" component="div" textAlign="center">
                Production country: {production_country}
              </Typography>
              <Typography gutterBottom variant="subtitle1" component="div" textAlign="center">
                Age restrictions: {age_restriction} +
              </Typography>
              <Typography gutterBottom variant="subtitle1" component="div" textAlign="center">
                Average grade:
                <Rating name="read-only" value={grade / 2} precision={0.5} readOnly />
                {grade}/10 ({reviews_count} reviews)
              </Typography>
              <ButtonGroup
                sx={{
                  marginBottom: 1,
                }}
              >
                <Button variant="contained" endIcon={<PlayCircleOutlineOutlinedIcon />} onClick={handlePlay}>
                  Play
                </Button>
                {(accountType === 2 || accountType === 3) && (
                  <Button onClick={handleBlockReviews} variant="outlined">
                    Block reviews
                  </Button>
                )}
              </ButtonGroup>
              <Reviews showId={id} reviews={selectedReviews} />
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
