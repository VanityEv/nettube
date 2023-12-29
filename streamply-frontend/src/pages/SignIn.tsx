import { Alert, Box, Container, Snackbar } from '@mui/material';
import { SignInPanel } from '../components/SignInPanel';
import { LoginImage } from '../components/LoginImage';

function SignIn() {
  return (
    <Container
      component="main"
      sx={{ display: 'flex', height: '100%', flexDirection: 'row', p: 0, backgroundColor: 'secondary.400' }}
    >
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
