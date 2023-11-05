import { Box, Grid, Paper, Typography } from '@mui/material';
import { AccountSection } from './AccountSection';
import { PersonalData } from './contents/PersonalData';
import { Security } from './contents/Security';

export const AccountPanel = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 3 }}>
      <Box component={Paper} elevation={4} sx={{ border: 2, borderRadius: '10px', p: 2, borderColor: 'primary.400' }}>
        <AccountSection name="Personal Data">
          <PersonalData />
        </AccountSection>
      </Box>
      <Box component={Paper} elevation={4} sx={{ border: 2, borderRadius: '10px', p: 2, borderColor: 'primary.400' }}>
        <AccountSection name="Security">
          <Security />
        </AccountSection>
      </Box>
    </Box>
  );
};
