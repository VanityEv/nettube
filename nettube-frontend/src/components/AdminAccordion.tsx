import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { AddBox, ChangeCircle, Delete, ExpandMore, Gavel } from '@mui/icons-material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
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
  const handleIsOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const handleCloseURLModal = () => setIsOpenURLModal(false);
  const [selectedType, setSelectedType] = useState<'film' | 'series'>('film');
  const { sendRequest } = useHttp();
  const videos = useAppSelector(state => state.videos.videos);
  const [users, setUsers] = useState<UserEntry[] | []>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : '70%',
    height: isMobile ? '100%' : '70%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: isMobile ? 2 : 12,
    objectFit: 'contain',
    overflowY: 'scroll',
  };
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

  const sendNewVideoQuery = useCallback(async (video: Video) => {
    const response = await sendRequest({
      method: 'POST',
      body: {
        title: video.title,
        type: video.type,
        genre: video.genre,
        production_year: video.production_year,
        production_country: video.production_country,
        director: video.director,
        age_restriction: video.age_restriction,
        tags: video.tags,
        descr: video.descr,
        thumbnail: video.thumbnail,
        alt: video.alt,
        tier: video.tier,
        link: video.link,
      },
      endpoint: `/videos/addVideo`,
    });
    if (response.result === 'success') {
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
      dispatch(fetchVideosData());
      handleClose();
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newVideo: Video = {
      id: -1,
      title: data.get('title') as string,
      type: selectedType,
      genre: data.get('genres') as string,
      production_year: parseInt(data.get('production_year') as string),
      production_country: data.get('production_country') as string,
      age_restriction: parseInt(data.get('age_restriction') as string),
      tags: data.get('tags') as string,
      director: data.get('director') as string,
      descr: data.get('descr') as string,
      thumbnail: data.get('thumbnail') as string,
      grade: 0,
      alt: data.get('alt') as string,
      tier: data.get('subscription_tier') as string,
      reviews_count: 0,
      link: data.get('link') as string,
    };
    sendNewVideoQuery(newVideo);
  };

  const handleOpenModal = (type: string) => {
    type === 'film' ? setSelectedType('film') : setSelectedType('series');
    handleIsOpen();
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
          <Grid2>
            <Grid2
              key="table-of-content"
              mobile={12}
              desktop={12}
              sx={{
                mx: 'auto',
                maxWidth: '100%',
                display: 'grid',
                pl: '20px',
                boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)',
              }}
            >
              {!isMobile && (
                <Box display="flex" flexDirection="row" alignItems="center" textAlign={'left'} paddingBottom={1}>
                  <Typography variant="overline" sx={{ width: '20%', wordWrap: 'wrap' }}>
                    User ID
                  </Typography>
                  <Typography variant="overline" sx={{ width: '20%', wordWrap: 'wrap' }}>
                    Username
                  </Typography>
                  <Typography variant="overline" sx={{ width: '20%', wordWrap: 'wrap' }}>
                    Email address
                  </Typography>
                  <Typography variant="overline" sx={{ width: '20%', wordWrap: 'wrap' }}>
                    Last login date
                  </Typography>
                </Box>
              )}
            </Grid2>
            {users.map((user, id) => (
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                textAlign={'left'}
                paddingBottom={1}
                sx={{ overflowX: isMobile ? 'scroll' : 'default', boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)' }}
              >
                <Typography sx={{ width: '20%', minWidth: '120px', wordWrap: 'wrap' }}>{user.id}</Typography>
                <Typography sx={{ fontWeight: 500, width: '20%', minWidth: '120px', wordWrap: 'wrap' }}>
                  {user.username}
                </Typography>
                <Typography sx={{ fontWeight: 500, width: '20%', minWidth: '120px', wordWrap: 'wrap' }}>
                  {user.email}
                </Typography>
                <Typography sx={{ fontWeight: 500, width: '20%', minWidth: '120px', wordWrap: 'wrap' }}>
                  {user.last_login.substring(0, 10)}
                </Typography>
                <IconButton
                  sx={{ mr: '30px', fontSize: '12px', minWidth: '120px' }}
                  onClick={() => {
                    handleUserDelete(user.id);
                  }}
                >
                  <Gavel />
                  Ban
                </IconButton>
              </Box>
            ))}
          </Grid2>
        </AccordionDetails>
      </Accordion>
      <Modal open={isOpen} onClose={handleClose} closeAfterTransition>
        <Fade in={isOpen}>
          <Box component="form" onSubmit={handleSubmit} sx={style}>
            <Typography variant="h5">Add New Video</Typography>
            <Stack spacing={2}>
              <TextField
                required
                id="title"
                label="title"
                name="title"
                defaultValue=""
                placeholder="Title"
                variant="standard"
              />
              <TextField
                required
                id="genres"
                name="genres"
                label="genres"
                defaultValue=""
                placeholder="Genres"
                variant="standard"
              />
              <TextField
                required
                id="production_year"
                name="production_year"
                label="production_year"
                defaultValue="1900"
                placeholder="Production Year"
                variant="standard"
              />
              <TextField
                required
                id="production_country"
                name="production_country"
                label="production_country"
                defaultValue=""
                placeholder="Production Country"
                variant="standard"
              />
              <TextField
                required
                id="director"
                name="director"
                label="director"
                defaultValue=""
                placeholder="Director"
                variant="standard"
              />
              <TextField
                required
                id="age_restriction"
                name="age_restriction"
                label="age_restriction"
                defaultValue="0"
                placeholder="Age Restrictions"
                variant="standard"
              />
              <TextField
                required
                id="tags"
                name="tags"
                label="tags"
                defaultValue=""
                placeholder="Tags"
                variant="standard"
              />
              <TextField
                required
                id="descr"
                name="descr"
                label="descr"
                defaultValue=""
                placeholder="Description"
                variant="standard"
              />
              <TextField
                required
                id="thumbnail"
                name="thumbnail"
                label="thumbnail"
                defaultValue=""
                placeholder="Thumbnail URL"
                variant="standard"
              />
              <TextField
                required
                id="alt"
                name="alt"
                label="alt"
                defaultValue=""
                placeholder="Alternate text"
                variant="standard"
              />
              <TextField
                required
                id="subscription_tier"
                name="subscription_tier"
                label="subscription_tier"
                defaultValue=""
                placeholder="Subscription Tier"
                variant="standard"
              />
              <TextField
                required
                id="link"
                name="link"
                label="link"
                defaultValue=""
                placeholder="Video link"
                variant="standard"
              />
            </Stack>
            <Button type="submit" size="large" variant="contained" sx={{ mt: 3, mb: 2 }}>
              Confirm
            </Button>
          </Box>
        </Fade>
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
          <Grid2
            key={'addnewvideo'}
            mobile={12}
            desktop={6}
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
          </Grid2>
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
                  <img src={video.thumbnail} className="review-thumbnail" />
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
            <Box display="flex" flexDirection="row" alignItems="center">
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
                  mx: 'auto',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pl: '20px',
                  boxShadow: '8px 8px 24px -21px rgba(66, 68, 90, 1)',
                }}
              >
                <Box display="flex" flexDirection="row" alignItems="center">
                  <img src={video.thumbnail} className="review-thumbnail" />
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
