import { Add, Block, CameraRoll, HighlightOff, LocalMovies, People } from '@mui/icons-material';
import { Box, Tab, Tabs, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useContext, useState } from 'react';
import { UsersTable } from './AdminPanel/tables/UsersTable';
import VideosTable from './AdminPanel/tables/VideosTable';
import { TableConfig, VideoActionsConfigType, tableColumns } from './AdminPanel/tables/VideoTableConfig';
import { TabPanel } from './TabPanel';
import { AddVideoForms } from './AdminPanel/AddVIdeoForms';
import axios from 'axios';
import { api } from '../constants';
import { SignalResponse } from '../types/response.types';
import { SnackbarContext } from '../App';
import { useGetUsers } from '../hooks/useGetUsers';
import { useGetVideos } from '../hooks/useGetVideos';
import { getCookie } from 'typescript-cookie';

export type UserEntry = {
  id: number;
  username: string;
  email: string;
  last_login: string;
};

function AdminTabs() {
  const { data: videos, refetch: refetchVideos } = useGetVideos();
  const theme = useTheme();
  const { data: users, refetch: refetchUsers } = useGetUsers();
  const { showSnackbar } = useContext(SnackbarContext);
  const [tabValue, setTabValue] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));

  const sendUserDeleteQuery = async (id: number) => {
    const response = await axios.post<SignalResponse>(
      `${api}/user/deleteUser`,
      { id: id },
      { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
    );
    if (response.data.result === 'SUCCESS') {
      showSnackbar('User deleted!', 'info');
      refetchUsers();
    }
  };

  //Delete video from database
  const sendVideoDeleteQuery = async (title: string) => {
    try {
      const response = await axios.post<SignalResponse>(
        `${api}/videos/deleteVideo`,
        {
          title: title,
        },
        {
          headers: {
            Authorization: `Bearer ${getCookie('userToken')}`,
          },
        }
      );
      if (response.data.result === 'SUCCESS') {
        showSnackbar('Video deleted!', 'info');
        refetchVideos();
      }
    } catch (error) {
      showSnackbar('Error while deleting show!', 'error');
    }
  };

  const sendBlockReviewsQuery = async (id: number, targetStatus: number) => {
    try {
      let shouldBeBlocked: number;
      if (!!targetStatus) {
        shouldBeBlocked = 0;
      } else {
        shouldBeBlocked = 1;
      }
      const response = await axios.post<SignalResponse>(
        `${api}/reviews/userReviews/blockReviews`,
        {
          id: id,
          targetStatus: shouldBeBlocked,
        },
        {
          headers: {
            Authorization: `Bearer ${getCookie('userToken')}`,
          },
        }
      );
      if (response.data.result === 'SUCCESS') {
        showSnackbar(`Reviews Blocked!`, 'info');
        refetchVideos();
      }
    } catch (error) {
      showSnackbar('Error while blocking reviews!', 'error');
    }
  };

  const handleUserDelete = (id: number) => {
    sendUserDeleteQuery(id);
  };

  //handler to pass to config
  const handleVideoDelete = (title: string) => {
    sendVideoDeleteQuery(title);
  };

  const handleVideoBlock = (id: number, targetStatus: number) => {
    sendBlockReviewsQuery(id, targetStatus);
  };

  if (!users) {
    return <Typography>'Error fetching users or no users on list...'</Typography>;
  }
  if (!videos) {
    return <Typography>'Error fetching videos or no videos on list...'</Typography>;
  }

  //actions for each entry
  const VideoActionsConfig: VideoActionsConfigType[] = [
    {
      icon: <HighlightOff sx={{ color: 'red' }} />,
      action: handleVideoDelete,
      actionDescription: 'Delete',
    },
    {
      icon: <Block sx={{ color: 'white' }} />,
      action: handleVideoBlock,
      actionDescription: 'Block Reviews',
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
        <UsersTable users={users} onDelete={handleUserDelete} />
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
