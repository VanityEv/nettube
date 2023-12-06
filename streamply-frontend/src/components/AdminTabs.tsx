import {
  CameraRoll,
  HighlightOff,
  LocalMovies,
  People,
  Person,
} from '@mui/icons-material';
import { Alert, Box, Snackbar, Tab, Tabs } from '@mui/material';
import useHttp from '../hooks/useHttp';
import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { uiActions } from '../store/ui';
import { fetchVideosData } from '../store/videos-actions';
import { UsersTable } from './AdminPanel/tables/UsersTable';
import VideosTable from './AdminPanel/tables/VideosTable';
import { TableConfig, VideoActionsConfigType, tableColumns } from './AdminPanel/tables/VideoTableConfig';
import { TabPanel } from './TabPanel';
import { AccountPanel } from './AccountPanel/AccountPanel';

export type UserEntry = {
  id: number;
  username: string;
  email: string;
  last_login: string;
};

//TODO: CSS - poprawki i layout
function AdminTabs() {
  const dispatch = useAppDispatch();
  const snackbar = useAppSelector(state => state.ui.snackbar);
  const videos = useAppSelector(state => state.videos.videos);
  const [tabValue, setTabValue] = useState(0);

  const { sendRequest } = useHttp();
  const [users, setUsers] = useState<UserEntry[] | []>([]);

  const sendFetchUsersQuery = useCallback(async () => {
    const response = await sendRequest({
      method: 'GET',
      endpoint: `/user/getAllUsers`,
    });
    if (response.result === 'success') {
      setUsers(response.data);
    }
  }, []);

  const sendUserDeleteQuery = useCallback(async (id: number) => {
    const response = await sendRequest({
      method: 'POST',
      body: {
        id: id,
      },
      endpoint: `/user/deleteUser`,
    });
    if (response.result === 'success') {
      dispatch(
        uiActions.onShowSnackbar({
          snackbar: {
            content: 'User has been banned!',
            severity: 'success',
          },
        })
      );
      setTimeout(() => {
        dispatch(uiActions.onHideSnackbar());
      }, 3000);
      sendFetchUsersQuery();
    }
  }, []);

  //Delete video from database
  const sendVideoDeleteQuery = useCallback(async (title: string) => {
    const response = await sendRequest({
      method: 'POST',
      body: {
        title: title,
      },
      endpoint: `/videos/deleteVideo`,
    });
    if (response.result === 'success') {
      dispatch(
        uiActions.onShowSnackbar({
          snackbar: {
            content: 'Video has been deleted!',
            severity: 'success',
          },
        })
      );
      setTimeout(() => {
        dispatch(uiActions.onHideSnackbar());
      }, 3000);
      dispatch(fetchVideosData());
    }
  }, []);

  const handleUserDelete = (id: number) => {
    sendUserDeleteQuery(id)
  }

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

  useEffect(() => {
    sendFetchUsersQuery();
  }, [sendFetchUsersQuery]);

  return (
    <Box sx={{ flexGrow: 3, pb: 3 }}>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={snackbar.isOpened}>
        <Alert
          onClose={() => {
            dispatch(
              uiActions.onShowSnackbar({
                snackbar: {
                  content: 'Video has been added!',
                  severity: 'success',
                },
              })
            );
            setTimeout(() => {
              dispatch(uiActions.onHideSnackbar());
            }, 3000);
          }}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.content}
        </Alert>
      </Snackbar>
      <Tabs
        value={tabValue}
        onChange={(event, newValue: number) => setTabValue(newValue)}
        variant="fullWidth"
        sx={{
          p: 3,
          '&>div>div': { gap: 2 },
        }}
      >
        <Tab icon={<People />} iconPosition="start" label="Users" value={0} sx={{ color: 'primary.300' }} />
        <Tab icon={<LocalMovies />} iconPosition="start" label="Movies" value={1} sx={{ color: 'primary.300' }} />
        <Tab icon={<CameraRoll />} iconPosition="start" label="Series" value={2} sx={{ color: 'primary.300' }} />
        <Tab icon={<Person />} iconPosition="start" label="Account" value={3} sx={{ color: 'primary.300' }} />
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
        <AccountPanel />
      </TabPanel>
    </Box>
  );
}

export default AdminTabs;
