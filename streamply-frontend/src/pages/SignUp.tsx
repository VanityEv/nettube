import { Box, Container } from '@mui/material';
import { LoginImage } from '../components/LoginImage';
import { SignUpPanel } from '../components/SingUpPanel';

function SignIn() {
  return (
    <Container
      component="main"
      sx={{ display: 'flex', height: '100%', flexDirection: 'row', p: 0, backgroundColor: 'secondary.400' }}
    >
      <Box sx={{ width: { mobile: '100%', desktop: '50%' }, height: '100%' }}>
        <SignUpPanel />
      </Box>
      <Box sx={{ display: { mobile: 'none', desktop: 'flex' }, width: '50%', height: '100%' }}>
        <LoginImage />
      </Box>
    </Container>
  );
}
export default SignIn;
