import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { TabPanel } from '../TabPanel';
import { UploadVideoForm } from '../UploadVideoForm/UploadVideoForm';
import { UploadEpisodeForm } from '../UploadVideoForm/UploadEpisodeForm';

export const AddVideoForms = () => {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ flexGrow: 3, pb: 3 }}>
      <Tabs
        value={tabValue}
        onChange={(event, newValue: number) => setTabValue(newValue)}
        indicatorColor="secondary"
        textColor="secondary"
        sx={{
          p: 3,
          '&>div>div': { gap: 2 },
        }}
      >
        <Tab label="Upload Movie/Series" value={0} />
        <Tab label="Upload Series Episode" value={1} />
      </Tabs>
      <TabPanel index={0} value={tabValue}>
        <UploadVideoForm />
      </TabPanel>
      <TabPanel index={1} value={tabValue}>
        <UploadEpisodeForm />
      </TabPanel>
    </Box>
  );
};
