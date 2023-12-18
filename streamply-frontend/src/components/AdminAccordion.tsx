import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import {
  CameraRoll,
  ExpandMore,
  HighlightOff,
  LocalMovies,
  People,
  PeopleOutline,
  Person,
  Theaters,
} from '@mui/icons-material';
import { Alert, Box, Button, Fade, Modal, Snackbar, Stack, Tab, Tabs, TextField } from '@mui/material';
import useHttp from '../hooks/useHttp';
import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { Video } from '../store/videos.types';
import { uiActions } from '../store/ui';
import { fetchVideosData } from '../store/videos-actions';
import { AddVideoForm } from './AdminPanel/AddVideoForm';
import { UsersTable } from './AdminPanel/tables/UsersTable';
import VideosTable from './AdminPanel/tables/VideosTable';
import { TableConfig, VideoActionsConfigType, tableColumns } from './AdminPanel/tables/VideoTableConfig';
import { TabPanel } from './TabPanel';
import ProfileCard from './ProfileCard';
import { AccountPanel } from './AccountPanel/AccountPanel';
import { useVideosStore } from '../state/videosStore';

export type UserEntry = {
  id: number;
  username: string;
  email: string;
  last_login: string;
};

//TODO: CSS - poprawki i layout
function AdminAccordion() {
  const dispatch = useAppDispatch();
  const snackbar = useAppSelector(state => state.ui.snackbar);
  const [newURL, setNewURL] = useState('');
  const { videos } = useVideosStore();
  const [videoTitle, setVideoTitle] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenURLModal, setIsOpenURLModal] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const { sendRequest } = useHttp();
  const [users, setUsers] = useState<UserEntry[] | []>([]);

  const styleChangeURLModal = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { mobile: '100%', dekstop: '20%' },
    height: '20%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: { mobile: 2, dekstop: 12 },
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };
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

  //handler to pass to config
  const handleVideoDelete = (title: string) => {
    sendVideoDeleteQuery(title);
  };

  const sendVideoURLChangeQuery = useCallback(async (title: string, url: string) => {
    const response = await sendRequest({
      method: 'POST',
      body: {
        title: title,
        url: url,
      },
      endpoint: `/videos/changeURL`,
    });
    if (response.result === 'success') {
      dispatch(
        uiActions.onShowSnackbar({
          snackbar: {
            content: 'Video URL has been added!',
            severity: 'success',
          },
        })
      );
      setTimeout(() => {
        dispatch(uiActions.onHideSnackbar());
      }, 3000);
    }
  }, []);

  const handleUserDelete = (id: number) => {
    sendUserDeleteQuery(id);
  };
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewURL(event.target.value);
  };

  const handleVideoURLChange = () => {
    sendVideoURLChangeQuery(videoTitle, newURL);
    setIsOpenURLModal(false);
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
        <Tab icon={<People />} iconPosition="start" label="Users" value={0} sx={{ color: 'primary.600' }} />
        <Tab icon={<LocalMovies />} iconPosition="start" label="Movies" value={1} sx={{ color: 'primary.600' }} />
        <Tab icon={<CameraRoll />} iconPosition="start" label="Series" value={2} sx={{ color: 'primary.600' }} />
        <Tab icon={<Person />} iconPosition="start" label="Account" value={3} sx={{ color: 'primary.600' }} />
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
      {/* <Modal open={isOpen} onClose={handleOpenChange} closeAfterTransition>
        <AddVideoForm handleOpenChange={handleOpenChange} />
      </Modal>
      <Modal open={isOpenURLModal} onClose={handleCloseURLModal} closeAfterTransition>
        <Fade in={isOpenURLModal}>
          <Box component="div" sx={styleChangeURLModal}>
            <Stack spacing={3}>
              <TextField
                required
                id="newURL"
                name="newURL"
                label="newURL"
                defaultValue=""
                placeholder="New URL"
                variant="standard"
                onChange={handleChange}
                fullWidth
              />
              <Button size="small" variant="contained" onClick={handleVideoURLChange}>
                Confirm
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Modal> */}
    </Box>
  );
}

export default AdminAccordion;
