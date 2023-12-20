import { Reviews, SavedSearch, Settings } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { TabPanel } from './TabPanel';
import { AccountPanel } from './AccountPanel/AccountPanel';

export type UserEntry = {
  id: number;
  username: string;
  email: string;
  last_login: string;
};

function UserTabs() {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ flexGrow: 3, pb: 3 }}>
      <Tabs
        value={tabValue}
        onChange={(event, newValue: number) => setTabValue(newValue)}
        variant="fullWidth"
        indicatorColor="secondary"
        textColor="secondary"
        sx={{
          flexWrap: 'wrap',
          p: 3,
          '&>div>div': { gap: 2 },
        }}
      >
        <Tab icon={<Settings />} iconPosition="start" label="Profile Settings" value={0} />
        <Tab icon={<SavedSearch />} iconPosition="start" label="Your Watchlist" value={1} />
        <Tab icon={<Reviews />} iconPosition="start" label="Reviews & Comments" value={2} />
      </Tabs>
      <TabPanel index={0} value={tabValue}>
        <AccountPanel />
      </TabPanel>
      <TabPanel index={1} value={tabValue}>
        <></>
      </TabPanel>
      <TabPanel index={2} value={tabValue}>
        <></>
      </TabPanel>
    </Box>
  );
}

export default UserTabs;
