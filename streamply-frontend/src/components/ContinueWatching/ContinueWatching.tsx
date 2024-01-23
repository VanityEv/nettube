import { Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { Scrollbar, Autoplay, Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ProgressVideo } from './ProgressVideo';
import { useGetProgressedVideos } from '../../hooks/useGetProgressedVideos';
import { useUserStore } from '../../state/userStore';
import axios from 'axios';
import { SignalResponse } from '../../types/response.types';
import { api } from '../../constants';
import { getCookie } from 'typescript-cookie';
import { useContext } from 'react';
import { SnackbarContext } from '../../App';

export const ContinueWatching = () => {
  const { username } = useUserStore();
  const { data: progressedVideos, refetch } = useGetProgressedVideos(username);
  const { showSnackbar } = useContext(SnackbarContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));

  const handleProgessVideoDelete = async (id: number) => {
    try {
      const response = await axios.post<SignalResponse>(
        `${api}/videos/deleteProgressedVideo/${username}`,
        { showID: id, username: username },
        { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
      );
      if (response.data.result === 'SUCCESS') {
        showSnackbar('Deleted!', 'success');
        refetch();
      }
    } catch (error) {
      showSnackbar('Error while deleting video', 'error');
    }
  };

  if (!progressedVideos) {
    return <></>;
  }
  return (
    <>
      <Typography variant={'h4'} color="white" sx={{ ml: '2rem', fontWeight: '700' }}>
        Continue Watching
      </Typography>
      <Box sx={{ width: '100%' }}>
        <Swiper
          modules={[Navigation, Scrollbar, Autoplay]}
          slidesPerView={isMobile ? 1 : 3}
          draggable
          loop
          navigation
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}
        >
          {progressedVideos.map(video => (
            <SwiperSlide key={`continue-watching-${video.title}`}>
              <ProgressVideo watched={video.time_watched} video={video} deleteHandler={handleProgessVideoDelete} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </>
  );
};
