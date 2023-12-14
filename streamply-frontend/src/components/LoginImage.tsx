import { Box } from '@mui/material';

export const LoginImage = () => (
  <Box
    sx={{
      backgroundImage: 'url(/assets/images/login-image.jpg)',
      width: '100%',
      height: '100%',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      justifyContent: 'center',
      borderBottomLeftRadius: '25%',
    }}
  ></Box>
);
