import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { AddBox, ChangeCircle, Delete, ExpandMore, Gavel } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Fade,
  IconButton,
  Modal,
  Rating,
  Snackbar,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import useHttp from '../hooks/useHttp';
import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { Video } from '../store/videos.types';
import { uiActions } from '../store/ui';
import { fetchVideosData } from '../store/videos-actions';
import { AddVideoForm } from './AdminPanel/AddVideoForm';
import { UsersTable } from './AdminPanel/UsersTable';

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
  const [videoTitle, setVideoTitle] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenURLModal, setIsOpenURLModal] = useState(false);
  const handleOpenChange = () => {setIsOpen((prev) => !prev)}
  const handleCloseURLModal = () => setIsOpenURLModal(false);
  const [selectedType, setSelectedType] = useState<'film' | 'series'>('film');
  const { sendRequest } = useHttp();
  const videos = useAppSelector(state => state.videos.videos);
  const [users, setUsers] = useState<UserEntry[] | []>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));

  const styleChangeURLModal = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '100%' : '20%',
    height: isMobile ? '20%' : '20%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: isMobile ? 2 : 12,
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



  const handleOpenModal = (type: string) => {
    type === 'film' ? setSelectedType('film') : setSelectedType('series');
    handleOpenChange();
  };
  const handleVideoDelete = (title: string) => {
    sendVideoDeleteQuery(title);
  };

  const handleVideoURLChange = () => {
    sendVideoURLChangeQuery(videoTitle, newURL);
    setIsOpenURLModal(false);
  };

  const handleIsOpenUrlModal = (title: string) => {
    setVideoTitle(title);
    setIsOpenURLModal(true);
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
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
          <Typography>Manage Users</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Box
              sx={{
                mx: 'auto',
                maxWidth: '100%',
                display: 'grid',
                pl: '20px',
                boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)',
              }}
            >
            </Box>
            <UsersTable users={users} onDelete={handleUserDelete}/>
          </Box>
        </AccordionDetails>
      </Accordion>
      <Modal open={isOpen} onClose={handleOpenChange} closeAfterTransition>
          <AddVideoForm handleOpenChange={handleOpenChange}/>
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
      </Modal>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
          <Typography>Manage Movies</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              maxHeight: 150,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              pl: '20px',
              boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)',
            }}
          >
            <Box display="flex" flexDirection="row" alignItems="center">
              <IconButton onClick={() => handleOpenModal('film')}>
                <AddBox fontSize="large" />
              </IconButton>
            </Box>
          </Box>
          {videos.map((video, id) =>
            video.type === 'film' ? (
              <Box
                sx={{
                  pl: '20px',
                  boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)',
                  overflowX: isMobile ? 'scroll' : 'default',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Box display="flex" flexDirection="row" alignItems="center" sx={{ width: '50%', minWidth: '300px' }}>
                  <img src={video.thumbnail} alt="video-thumbnail" className="review-thumbnail" />
                  <Typography
                    sx={{
                      letterSpacing: '1px',
                      fontWeight: 700,
                      pl: '30px',
                    }}
                  >
                    {video.title}
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  sx={{ ml: '30px', width: '50%', minWidth: '300px', alignItems: 'center' }}
                >
                  <Typography>Average grade:</Typography>
                  <Rating name="read-only" value={video.grade / 2} precision={0.5} readOnly sx={{ pr: '15px' }} />
                  <Typography>
                    {video.grade}
                    /10 ({video.reviews_count} reviews)
                  </Typography>
                  <IconButton
                    sx={{ mr: '30px', fontSize: '12px' }}
                    onClick={() => {
                      handleIsOpenUrlModal(video.title);
                    }}
                  >
                    <ChangeCircle />
                    Change video URL
                  </IconButton>
                  <IconButton
                    sx={{ fontSize: '12px' }}
                    onClick={() => {
                      handleVideoDelete(video.title);
                    }}
                  >
                    <Delete />
                    Delete
                  </IconButton>
                </Box>
              </Box>
            ) : null
          )}
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
          <Typography>Manage Series</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              mx: 'auto',
              maxHeight: 150,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              pl: '20px',
              boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)',
            }}
          >
            <Box display="flex" flexDirection="row" alignItems="center" sx={{ width: '50%', minWidth: '300px' }}>
              <IconButton
                sx={{ fontSize: '12px' }}
                onClick={() => {
                  handleOpenModal('series');
                }}
              >
                <AddBox fontSize="large" />
              </IconButton>
            </Box>
          </Box>
          {videos.map((video, id) =>
            video.type === 'series' ? (
              <Box
                sx={{
                  pl: '20px',
                  boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)',
                  overflowX: isMobile ? 'scroll' : 'default',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Box display="flex" flexDirection="row" alignItems="center" sx={{ width: '50%', minWidth: '300px' }}>
                  <img src={video.thumbnail} alt="series-thumbnail" className="review-thumbnail" />
                  <Typography sx={{ pl: '30px', letterSpacing: '1px', fontWeight: 700 }}>{video.title}</Typography>
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  sx={{ ml: '30px', width: '50%', minWidth: '300px', alignItems: 'center' }}
                >
                  <Typography>Average grade:</Typography>
                  <Rating name="read-only" value={video.grade / 2} precision={0.5} readOnly sx={{ pr: '15px' }} />
                  <Typography>
                    {video.grade}/10 ({video.reviews_count} reviews)
                  </Typography>
                  <IconButton
                    sx={{ mr: '30px', fontSize: '12px' }}
                    onClick={() => {
                      handleIsOpenUrlModal(video.title);
                    }}
                  >
                    <ChangeCircle />
                    Change video URL
                  </IconButton>
                  <IconButton
                    sx={{ mr: '30px', fontSize: '12px' }}
                    onClick={() => {
                      handleVideoDelete(video.title);
                    }}
                  >
                    <Delete />
                    Delete
                  </IconButton>
                </Box>
              </Box>
            ) : null
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default AdminAccordion;
