import { Box, Typography } from '@mui/material';
import loginImage from '../../public/assets/images/login-image.jpg';

export const LoginImage = () => (
  <Box
    sx={{
      backgroundImage: 'url(/assets/images/login-image.jpg)',
      width: '100%',
      height: '100%',
      backgroundSize: 'cover',
      display: 'flex',
      justifyContent: 'center',
      borderBottomLeftRadius: '25%',
    }}
  ></Box>
);
