import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { userLogin } from '../store/user-actions';
import { UserCredentials } from '../store/user.types';
import { useNavigate } from 'react-router-dom';
import { uiActions } from '../store/ui';
import useIsFirstRender from '../hooks/useIsFirstRender';
import { Alert, Box, Container, Snackbar } from '@mui/material';
import { SignInPanel } from '../components/SignInPanel';

function SignIn() {
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

  useEffect(() => {
    if (!isSigningIn) {
      if (localStorage.getItem('userToken') === null || localStorage.getItem('userToken') === 'undefined') {
        if (!isFirstRender) {
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
        }
      } else {
        navigate('/');
      }
    }
  }, [isSigningIn]);

  return (
    <Container component="main" sx={{display: 'flex', height:'100%', flexDirection: 'row', p:0}}>
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
      <Box sx={{width:{mobile:'100%', desktop:'50%'}, height:'100%'}}>
     <SignInPanel handleSubmit={handleSubmit}/>
     </Box>
     <Box sx={{display:{mobile:'none', desktop: 'flex'}, width:'50%', height:'100%'}}>
     <img src='https://wallpapercave.com/wp/wp3982534.jpg' style={{objectFit:'cover', width:'100%', height:'100%'}}/>
     </Box>
    </Container>
  );
}
export default SignIn;
