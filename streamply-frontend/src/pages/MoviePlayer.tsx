import { Box } from '@mui/material';
import { useContext, useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import VideoJS from '../components/VideoJS';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from 'typescript-cookie';
import { api } from '../constants';
import { SignalResponse } from '../types/response.types';
import { SnackbarContext } from '../App';
import { useUserStore } from '../state/userStore';

export const MoviePlayer = () => {
  const { title } = useParams();
  const { showSnackbar } = useContext(SnackbarContext);
  const { username } = useUserStore();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const timestamp = queryParams.get('timestamp');
  const showID = queryParams.get('id');
  const options = {
    controls: true,
    fill: true,
    responsive: true,
    controlBar: {
      pictureInPictureToggle: false,
      skipButtons: {
        forward: 10,
        backward: 10,
      }
    },
    sources: [
      {
        src: `http://localhost:3001/movies/${title}/${title}.m3u8`,
        type: 'application/x-mpegURL',
      },
    ],
  };

  const handleVideoProgressSave = async (timestamp: number | undefined) => {
    try {
      if (!timestamp) {
        return;
      }
      const response = await axios.post<SignalResponse>(
        `${api}/videos/setProgress/${username}`,
        { showID: showID, timeWatched: timestamp },
        { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
      );
      if (response.data.result === 'SUCCESS') {
        return;
      }
    } catch (error) {
      showSnackbar(`Error occured while trying to save video progress`, 'error');
    }
  };

  const playerRef = useRef<Player | null>(null);

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on('waiting', () => {
      videojs.log('player is waiting');
    });

    player.on('dispose', () => {
      handleVideoProgressSave(player.currentTime());
      videojs.log('player will dispose');
    });
    player.on('loadedmetadata', () => {
      if (timestamp) {
        player.currentTime(Number(timestamp));
      }
    });
  };

  return (
    <Box
      sx={{
        height: { mobile: 'auto', desktop: '50vmin' },
        width: { mobile: '100vmin', desktop: '70vmax' },
        m: 'auto',
      }}
    >
      <VideoJS options={options} onReady={handlePlayerReady} />;
    </Box>
  );
};
