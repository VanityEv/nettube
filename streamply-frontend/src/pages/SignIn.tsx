import { useAppSelector } from '../hooks/useRedux';
import { uiActions } from '../store/ui';
import { Alert, Box, Container, Snackbar } from '@mui/material';
import { SignInPanel } from '../components/SignInPanel';
import { LoginImage } from '../components/LoginImage';

function SignIn() {
  const snackbar = useAppSelector(state => state.ui.snackbar);

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
