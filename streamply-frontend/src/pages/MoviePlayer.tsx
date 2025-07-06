import { Box } from '@mui/material';
import { useContext, useRef, useState, useEffect } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import VideoJSSecure from '../components/VideoJSSecure';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from 'typescript-cookie';
import { api } from '../constants';
import { SignalResponse } from '../types/response.types';
import { SnackbarContext } from '../App';
import { useUserStore } from '../state/userStore';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { deviceFingerprinter } from '../services/security/deviceFingerprinting';

export const MoviePlayer = () => {
  const { title } = useParams();
  const { showSnackbar } = useContext(SnackbarContext);
  const { username } = useUserStore();
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
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
      },
    },
    sources: [
      {
        src: `${api}/videos/video/stream/${showID}`,
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

  const checkSubscriptionAndPlay = async () => {
    try {
      const response = await axios.get(`${api}/user/getSubscription/${username}`, {
        headers: { Authorization: `Bearer ${getCookie('userToken')}` },
      });

      if (response.data.status !== 'active') {
        setSubscriptionModalOpen(true);
        return false;
      }
      return true;
    } catch (error) {
      setSubscriptionModalOpen(true);
      return false;
    }
  };

  const handlePlayerReady = async (player: Player) => {
    const hasAccess = await checkSubscriptionAndPlay();
    if (!hasAccess) {
      player.pause();
      return;
    }

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
    <>
      <Box
        sx={{
          height: { mobile: 'auto', desktop: '50vmin' },
          width: { mobile: '100vmin', desktop: '70vmax' },
          m: 'auto',
        }}
      >
        <VideoJSSecure options={options} onReady={handlePlayerReady} />
      </Box>

      <SubscriptionModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        videoTitle={title}
      />
    </>
  );
};
