import { Add, CameraRoll, HighlightOff, LocalMovies, People } from '@mui/icons-material';
import { Box, Tab, Tabs, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import { UsersTable } from './AdminPanel/tables/UsersTable';
import VideosTable from './AdminPanel/tables/VideosTable';
import { TableConfig, VideoActionsConfigType, tableColumns } from './AdminPanel/tables/VideoTableConfig';
import { TabPanel } from './TabPanel';
import { useVideosStore } from '../state/videosStore';
import { AddVideoForms } from './AdminPanel/AddVIdeoForms';
import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { SignalResponse } from '../types/response.types';
import { SnackbarContext } from '../App';
import { useGetUsers } from '../hooks/useGetUsers';

export type UserEntry = {
  id: number;
  username: string;
  email: string;
  last_login: string;
};

//TODO: CSS - poprawki i layout
function AdminTabs() {
  const { videos } = useVideosStore();
  const theme = useTheme();
  const { data, refetch: refetchUsers } = useGetUsers();
  const { showSnackbar } = useContext(SnackbarContext);
  const [tabValue, setTabValue] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));

  const sendUserDeleteQuery = async (id: number) => {
    const response = await axios.post<SignalResponse>(`${SERVER_ADDR}:${SERVER_PORT}/user/deleteUser`, id);
    if (response.data.result === 'SUCCESS') {
      showSnackbar('User deleted!', 'info');
      refetchUsers();
    }
  };

  //Delete video from database
  const sendVideoDeleteQuery = async (title: string) => {
    const response = await axios.post<SignalResponse>(`${SERVER_ADDR}:${SERVER_PORT}/videos/deleteVideo`, title);
    if (response.data.result === 'SUCCESS') {
      showSnackbar('Video deleted!', 'info');
    }
  };

  const handleUserDelete = (id: number) => {
    sendUserDeleteQuery(id);
  };

  //handler to pass to config
  const handleVideoDelete = (title: string) => {
    sendVideoDeleteQuery(title);
  };

  //actions for each entry
  const VideoActionsConfig: VideoActionsConfigType[] = [
    {
      icon: <HighlightOff color="error" />,
      action: handleVideoDelete,
      actionDescription: 'Delete',
    },
  ];

  const MoviesTableConfig: TableConfig = {
    data: videos.filter(video => video.type === 'film'),
    columnNames: tableColumns,
    actions: VideoActionsConfig,
  };

  const SeriesTableConfig: TableConfig = {
    data: videos.filter(video => video.type === 'series'),
    columnNames: tableColumns,
    actions: VideoActionsConfig,
  };

  if (!data) {
    return <Typography>'Error fetching users or no users on list...'</Typography>;
  }

  return (
    <Box sx={{ flexGrow: 3, pb: 3 }}>
      <Tabs
        value={tabValue}
        onChange={(event, newValue: number) => setTabValue(newValue)}
        variant={isMobile ? 'scrollable' : 'fullWidth'}
        scrollButtons="auto"
        indicatorColor="secondary"
        textColor="secondary"
        sx={{
          p: 3,
          '&>div>div': { gap: 2 },
        }}
      >
        <Tab icon={<People />} iconPosition="start" label="Users" value={0} />
        <Tab icon={<LocalMovies />} iconPosition="start" label="Movies" value={1} />
        <Tab icon={<CameraRoll />} iconPosition="start" label="Series" value={2} />
        <Tab icon={<Add />} iconPosition="start" label="Add Video" value={3} />
      </Tabs>
      <TabPanel index={0} value={tabValue}>
        <UsersTable users={data} onDelete={handleUserDelete} />
      </TabPanel>
      <TabPanel index={1} value={tabValue}>
        <VideosTable {...MoviesTableConfig} />
      </TabPanel>
      <TabPanel index={2} value={tabValue}>
        <VideosTable {...SeriesTableConfig} />
      </TabPanel>
      <TabPanel index={3} value={tabValue}>
        <AddVideoForms />
      </TabPanel>
    </Box>
  );
}

export default AdminTabs;
