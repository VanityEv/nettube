import { Box, Typography } from '@mui/material';
import { useContext, useRef, useState } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import VideoJSSecure from '../components/VideoJSSecure';
import { useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { api } from '../constants';
import { HttpClient } from '../utils/httpClient';
import { getCookie } from 'typescript-cookie';
import { SnackbarContext } from '../App';
import { Episodes } from '../components/VideoPage/contents/Episodes';
import { SubscriptionModal } from '../components/SubscriptionModal';

export const EpisodePlayer = () => {
  const { title, season, episode } = useParams();
  const { username } = useAppSelector(state => state.user);
  const { showSnackbar } = useContext(SnackbarContext);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const timestamp = queryParams.get('timestamp');
  const showID = queryParams.get('id');

  // Check subscription status before allowing video playback
  const checkSubscriptionAndPlay = async () => {
    try {
      const response = await HttpClient.get(`${api}/user/getSubscription/${username}`, {
        headers: { Authorization: `Bearer ${getCookie('userToken')}` },
      });

      if (response.status !== 'active') {
        setSubscriptionModalOpen(true);
        return false;
      }
      return true;
    } catch (error) {
      setSubscriptionModalOpen(true);
      return false;
    }
  };

  const options = {
    controls: true,
    fill: true,
    responsive: true,
    controlBar: {
      pictureInPictureToggle: false,
    },
    sources: [
      {
        // Use secured streaming endpoint
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
      const response = await HttpClient.post(
        `${api}/videos/setProgress/${username}`,
        { showID: showID, season: season, episode: episode, timeWatched: timestamp },
        { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
      );
      if (response.result === 'SUCCESS') {
        return;
      }
    } catch (error) {
      showSnackbar(`Error occured while trying to save video progress`, 'error');
    }
  };

  const playerRef = useRef<Player | null>(null);

  const handlePlayerReady = async (player: Player) => {
    // Check subscription before initializing player
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

    player.on('loadedmetadata', () => {
      player.currentTime(10);
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

        {showID && (
          <Box sx={{ width: '100%', my: '2rem', pb: '2rem' }}>
            <Typography variant="h5" sx={{ marginBottom: '1rem', color: 'white' }}>
              Other Episodes
            </Typography>
            <Episodes show_id={Number(showID)} />
          </Box>
        )}
      </Box>

      <SubscriptionModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        videoTitle={`${title} - Season ${season} Episode ${episode}`}
      />
    </>
  );
};
