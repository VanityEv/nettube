import { Box } from '@mui/material';
import { useContext, useRef, useState, useEffect, useCallback } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import VideoJSSecure from '../components/VideoJSSecure';
import { useLocation, useParams } from 'react-router-dom';
import { HttpClient } from '../utils/httpClient';
import { api } from '../constants';
import { SnackbarContext } from '../App';
import { useAppSelector } from '../store/hooks';
import { SubscriptionModal } from '../components/SubscriptionModal';

export const MoviePlayer = () => {
  const { title } = useParams();
  const { showSnackbar } = useContext(SnackbarContext);
  const { username } = useAppSelector(state => state.user);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [streamingUrl, setStreamingUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [watermarkConfig, setWatermarkConfig] = useState<any>(null);
  const [sessionError, setSessionError] = useState<string>(''); // Track session errors for UI
  const [retryTrigger, setRetryTrigger] = useState<number>(0); // Trigger for manual retries
  const playerRef = useRef<Player | null>(null);
  const sessionRequestRef = useRef<boolean>(false);
  const sessionErrorRef = useRef<boolean>(false); // Track if there was an error to prevent retries
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const timestamp = queryParams.get('timestamp');

  // Try to get showID from query params first, then from videoData
  const showIDFromQuery = queryParams.get('id');
  const showID = showIDFromQuery || videoData?.id;

  useEffect(() => {
    // If we already have showID from query params, no need to fetch by title
    if (showIDFromQuery) {
      setLoading(false);
      return;
    }

    // If we have a title but no ID, fetch the video data by title
    if (title) {
      const fetchVideoByTitle = async () => {
        try {
          const response = await HttpClient.get(`${api}/videos/titles/${title}`);
          if (response.result === 'success') {
            setVideoData(response);
          } else {
            console.error('API returned unsuccessful result:', response);
            showSnackbar('Video not found', 'error');
          }
        } catch (error) {
          console.error('Error fetching video by title:', error);
          showSnackbar('Failed to load video', 'error');
        } finally {
          setLoading(false);
        }
      };

      fetchVideoByTitle();
    } else {
      setLoading(false);
    }
  }, [title, showIDFromQuery, showSnackbar]);

  // Reset error state only when showID changes (new video)
  useEffect(() => {
    sessionErrorRef.current = false;
    setSessionError('');
  }, [showID]);

  // Set up streaming URL when we have a video ID
  useEffect(() => {
    const requestId = Math.random().toString(36).substring(7);

    if (!showID || sessionRequestRef.current || sessionErrorRef.current) {
      return;
    }

    // Prevent duplicate requests
    sessionRequestRef.current = true;

    // Fetch the secure streaming URL from our backend
    const fetchStreamingUrl = async () => {
      try {
        const response = await HttpClient.get(`${api}/videos/video/stream/${showID}?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        if (response.result === 'SUCCESS') {
          setStreamingUrl(response.streamingUrl);
          setSessionId(response.sessionId);
          setWatermarkConfig(response.watermark);
        } else {
          const errorMsg = 'Failed to get video stream';
          console.error(`❌ Failed to get streaming URL [${requestId}]:`, response.message);
          showSnackbar(errorMsg, 'error');
          setSessionError(errorMsg);
          sessionErrorRef.current = true; // Prevent retries on API error
        }
      } catch (error: any) {
        console.error(`❌ Error fetching streaming URL [${requestId}]:`, error);

        let errorMsg = 'Failed to authenticate video stream';

        // Check if it's a subscription required error (403)
        if (error.response?.status === 403 || error.status === 403) {
          console.log('🔒 Subscription required - opening subscription modal');
          console.log('Error details:', error);
          console.log('Current subscriptionModalOpen state:', subscriptionModalOpen);
          setSubscriptionModalOpen(true);
          console.log('Setting subscriptionModalOpen to true');
          
          // Set a specific error to prevent loading screen
          setSessionError('SUBSCRIPTION_REQUIRED');
          sessionErrorRef.current = true;
          return; // Don't show error snackbar, just open modal
        }
        // Check if it's a rate limit error
        else if (error.response?.status === 429 || error.status === 429) {
          errorMsg = 'Too many requests - please wait before retrying';
        }
        // Check for CORS errors
        else if (error.message?.includes('CORS') || error.code === 'ERR_NETWORK') {
          errorMsg = 'Network/CORS error - check backend configuration';
        }

        showSnackbar(errorMsg, 'error');
        setSessionError(errorMsg);
        sessionErrorRef.current = true; // Prevent retries on any error
      } finally {
        sessionRequestRef.current = false;
      }
    };

    fetchStreamingUrl();

    // Cleanup function
    return () => {
      sessionRequestRef.current = false;
      // Note: Don't reset sessionErrorRef here to prevent retries on component re-mount
    };
  }, [showID, showSnackbar, retryTrigger, subscriptionModalOpen]);

  // Manual retry function for when session loading fails
  const retrySessionLoading = useCallback(() => {
    sessionErrorRef.current = false;
    sessionRequestRef.current = false;
    setSessionError('');
    setStreamingUrl(''); // This will trigger the loading state
    setRetryTrigger(prev => prev + 1); // Trigger useEffect to run again
  }, []);

  if (loading || (!streamingUrl && !sessionError && !subscriptionModalOpen)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
        Loading video stream...
      </Box>
    );
  }

  // Show error state with retry option (but not for subscription errors)
  if (sessionError && !streamingUrl && sessionError !== 'SUBSCRIPTION_REQUIRED') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', color: '#f44336' }}>{sessionError}</div>
          <button
            onClick={retrySessionLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </Box>
      </Box>
    );
  }

  if (!showID) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <div>Video not found</div>
          <div style={{ fontSize: '0.8em', marginTop: '10px', color: '#666' }}>
            Debug info: title="{title}", showIDFromQuery="{showIDFromQuery}", videoData={videoData ? 'loaded' : 'null'}
          </div>
        </Box>
      </Box>
    );
  }

  // If subscription modal is open but no streaming URL, show placeholder
  if (subscriptionModalOpen && !streamingUrl) {
    return (
      <>
        <Box
          sx={{
            height: { mobile: 'auto', desktop: '50vmin' },
            width: { mobile: '100vmin', desktop: '70vmax' },
            m: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
            color: 'white',
            fontSize: '1.2em'
          }}
        >
          Premium content requires subscription
        </Box>

        <SubscriptionModal
          open={subscriptionModalOpen}
          onClose={() => setSubscriptionModalOpen(false)}
          videoTitle={title}
        />
      </>
    );
  }

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
        src: streamingUrl,
        type: 'application/x-mpegURL',
      },
    ],
  };

  const handleVideoProgressSave = async (timestamp: number | undefined) => {
    try {
      if (!timestamp) {
        return;
      }
      const response = await HttpClient.post(`${api}/videos/setProgress/${username}`, {
        showID: showID,
        timeWatched: timestamp,
      });
      if (response.result === 'SUCCESS') {
        return;
      }
    } catch (error) {
      showSnackbar(`Error occured while trying to save video progress`, 'error');
    }
  };

  const checkSubscriptionAndPlay = async () => {
    try {
      const response = await HttpClient.get(`${api}/user/getSubscription/${username}`);

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
        <VideoJSSecure
          options={options}
          onReady={handlePlayerReady}
          videoId={showID}
          sessionId={sessionId}
          watermarkConfig={watermarkConfig}
        />
      </Box>

      <SubscriptionModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        videoTitle={title}
      />
    </>
  );
};
