import { Stack, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useVideosStore } from '../state/videosStore';
import { useUserStore } from '../state/userStore';
import { useEffect } from 'react';

function Signout() {
  const { reset: resetVideos } = useVideosStore();
  const { reset: resetUser } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('account_type');
    resetUser();
    resetVideos();
  }, []);

  const returnToSignIn = () => {
    navigate('/signin');
  };
  return (
    <>
      <Container component="main" maxWidth="desktop" sx={{ display: 'flex', flexDirection: 'column', mt: 15, mb: 15 }}>
        <Stack spacing={3}>
          <Typography sx={{ textAlign: 'center', fontSize: '16px', color: 'white' }}>
            You were succesfully logged out.
          </Typography>
          <Button
            size="medium"
            variant="outlined"
            onClick={() => {
              returnToSignIn();
            }}
          >
            Continue
          </Button>
        </Stack>
      </Container>
    </>
  );
}

export default Signout;
