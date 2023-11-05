import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

type TabPanelProps = {
  children?: ReactNode;
  index: number;
  value: number;
};

export const TabPanel = ({ children, index, value, ...other }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};
