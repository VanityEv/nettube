import { Box, Typography } from '@mui/material';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Security = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '18px' }}>To change your password please click button below.</Typography>
      <ChangePasswordModal />
    </Box>
  );
};
