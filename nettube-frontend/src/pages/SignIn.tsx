import { useEffect, useState } from 'react';
import { Link, Box, Typography, Container, TextField, Button, Snackbar, Alert } from '@mui/material';
import { Stack } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { userLogin } from '../store/user-actions';
import { UserCredentials } from '../store/user.types';
import { useNavigate } from 'react-router-dom';
import { uiActions } from '../store/ui';

function SignIn() {
  const isSigningIn = useAppSelector(state => state.user.isLoading);
  const snackbar = useAppSelector(state => state.ui.snackbar);
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

  useEffect(() => {
    if (!isSigningIn) {
      if (localStorage.getItem('userToken') === null || localStorage.getItem('userToken') === 'undefined') {
        dispatch(
          uiActions.onShowSnackbar({
            snackbar: {
              content: 'Invalid credentials!',
              severity: 'error',
            },
          })
        );
        setTimeout(() => {
          dispatch(uiActions.onHideSnackbar());
        }, 3000);
      } else {
        navigate('/');
      }
    }
  }, [isSigningIn]);

  return (
    <Container component="main" maxWidth="desktop">
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
        >
          {snackbar.content}
        </Alert>
      </Snackbar>
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img alt="logo" src="logo.svg" width="150px" height="auto" />
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3, pb: 2 }}>
          <Stack spacing={3}>
            <TextField
              aria-label="username-field"
              name="username"
              required
              fullWidth
              id="username"
              label="Username"
              autoFocus
            />
            <TextField
              aria-label="password-field"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Sign In
            </Button>
            <Link href="/reset-password" variant="body1">
              Forgot password?
            </Link>
            <Link href="/signup" variant="body1">
              Not a member? Register now!
            </Link>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}
export default SignIn;
