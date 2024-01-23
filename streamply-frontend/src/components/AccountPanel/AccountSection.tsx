import { Typography, Divider } from '@mui/material';
import { ReactNode } from 'react';

export const AccountSection = ({ name, children }: { name: string; children: ReactNode }) => {
  return (
    <>
      <Typography variant="h5">{name}</Typography>
      <Divider sx={{ my: 2 }} />
      {children}
    </>
  );
};
