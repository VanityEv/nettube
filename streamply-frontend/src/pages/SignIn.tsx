import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { userLogin } from '../store/user-actions';
import { UserCredentials } from '../store/user.types';
import { useNavigate } from 'react-router-dom';
import { uiActions } from '../store/ui';
import useIsFirstRender from '../hooks/useIsFirstRender';
import { Alert, Box, Container, Snackbar } from '@mui/material';
import { SignInPanel } from '../components/SignInPanel';
import { LoginImage } from '../components/LoginImage';
import { useVideosStore } from '../state/videosStore';
import { useUserStore } from '../state/userStore';

function SignIn() {
  const { setVideos } = useVideosStore();
  const { setUserData } = useUserStore();
  const isSigningIn = useAppSelector(state => state.user.isSigningIn);
  const snackbar = useAppSelector(state => state.ui.snackbar);
  const isFirstRender = useIsFirstRender();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const userCredentials: UserCredentials = {
      username: data.get('username') as string,
      password: data.get('password') as string,
    };
    dispatch(userLogin(userCredentials));
  };

  return (
    <Container
      component="main"
      sx={{ display: 'flex', height: '100%', flexDirection: 'row', p: 0, backgroundColor: 'secondary.400' }}
    >
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={snackbar.isOpened}>
        <Alert
          onClose={() => {
            uiActions.onShowSnackbar({
              snackbar: {
                content: 'Invalid credentials!',
                severity: 'error',
              },
            });
          }}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        />
      </Snackbar>
      <Box sx={{ width: { mobile: '100%', desktop: '50%' }, height: '100%' }}>
        <SignInPanel />
      </Box>
      <Box sx={{ display: { mobile: 'none', desktop: 'flex' }, width: '50%', height: '100%' }}>
        <LoginImage />
      </Box>
    </Container>
  );
}
export default SignIn;
