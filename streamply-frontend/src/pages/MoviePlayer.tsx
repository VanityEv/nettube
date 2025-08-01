import { Box } from '@mui/material';
import { useContext, useRef, useState, useEffect, useCallback } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import VideoJSSecure from '../components/VideoJSSecure';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from 'typescript-cookie';
import { api } from '../constants';
import { SignalResponse } from '../types/response.types';
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

  console.log('MoviePlayer state:', {
    title,
    showIDFromQuery,
    videoData: videoData ? { id: videoData.id, title: videoData.title } : null,
    showID,
    loading,
    streamingUrl: streamingUrl ? 'Available' : 'Not loaded',
    currentOrigin: window.location.origin,
    apiEndpoint: api,
  });

  useEffect(() => {
    // If we already have showID from query params, no need to fetch by title
    if (showIDFromQuery) {
      console.log('Using showID from query params:', showIDFromQuery);
      setLoading(false);
      return;
    }

    // If we have a title but no ID, fetch the video data by title
    if (title) {
      console.log('Fetching video data for title:', title);
      const fetchVideoByTitle = async () => {
        try {
          const response = await axios.get(`${api}/videos/titles/${title}`);
          console.log('API response:', response.data);
          if (response.data.result === 'success') {
            setVideoData(response.data);
            console.log('Video data set:', response.data);
          } else {
            console.error('API returned unsuccessful result:', response.data);
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
      console.log('No title provided');
      setLoading(false);
    }
  }, [title, showIDFromQuery, showSnackbar]);

  // Reset error state only when showID changes (new video)
  useEffect(() => {
    console.log('🆕 Video ID changed, resetting error states for:', showID);
    sessionErrorRef.current = false;
    setSessionError('');
  }, [showID]);

  // Set up streaming URL when we have a video ID
  useEffect(() => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🔄 useEffect triggered for streaming URL [${requestId}]:`, {
      showID,
      sessionRequestInProgress: sessionRequestRef.current,
      sessionErrorOccurred: sessionErrorRef.current,
      retryTrigger,
    });

    if (!showID || sessionRequestRef.current || sessionErrorRef.current) {
      console.log(`🚫 Skipping request [${requestId}] - conditions not met`);
      return;
    }

    // Prevent duplicate requests
    sessionRequestRef.current = true;

    // Get user token for authentication
    const userToken = getCookie('userToken');
    if (!userToken) {
      const errorMsg = 'Authentication required - please log in';
      showSnackbar(errorMsg, 'error');
      setSessionError(errorMsg);
      sessionErrorRef.current = true; // Prevent retries on auth error
      sessionRequestRef.current = false; // Reset request flag
      return;
    }

    // Fetch the secure streaming URL from our backend
    const fetchStreamingUrl = async () => {
      try {
        console.log(`📡 Fetching streaming URL [${requestId}] for video ID:`, showID);
        console.log(`🔧 API endpoint:`, `${api}/videos/video/stream/${showID}`);
        console.log(`🔧 User token:`, userToken ? `${userToken.substring(0, 20)}...` : 'No token');

        const response = await axios.get(`${api}/videos/video/stream/${showID}?t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
          },
        });

        if (response.data.result === 'SUCCESS') {
          console.log(`🎬 Backend response [${requestId}]:`, {
            streamingUrl: response.data.streamingUrl,
            sessionId: response.data.sessionId,
            antiPiracySessionId: response.data.antiPiracySessionId,
            watermark: response.data.watermark ? 'Present' : 'None',
          });

          // Extract session ID from the streaming URL for verification
          const urlSessionMatch = response.data.streamingUrl.match(/session=([^&]+)/);
          const urlSessionId = urlSessionMatch ? urlSessionMatch[1] : 'Not found';
          console.log(`🔍 Session ID verification [${requestId}]:`, {
            'Backend sessionId': response.data.sessionId,
            'URL sessionId': urlSessionId,
            Match: response.data.sessionId === urlSessionId,
          });

          setStreamingUrl(response.data.streamingUrl);
          setSessionId(response.data.sessionId);
          setWatermarkConfig(response.data.watermark);
        } else {
          const errorMsg = 'Failed to get video stream';
          console.error(`❌ Failed to get streaming URL [${requestId}]:`, response.data.message);
          showSnackbar(errorMsg, 'error');
          setSessionError(errorMsg);
          sessionErrorRef.current = true; // Prevent retries on API error
        }
      } catch (error: any) {
        console.error(`❌ Error fetching streaming URL [${requestId}]:`, error);

        let errorMsg = 'Failed to authenticate video stream';

        // Check if it's the ngrok warning page
        if (
          error.response?.data &&
          typeof error.response.data === 'string' &&
          error.response.data.includes('ngrok-free.app')
        ) {
          errorMsg = 'Ngrok warning page detected - API configuration issue';
          console.error('Ngrok warning page detected:', error.response.data.substring(0, 200));
        }
        // Check if it's a rate limit error
        else if (error.response?.status === 429) {
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
      console.log(`🧹 Cleanup streaming URL effect [${requestId}]`);
      sessionRequestRef.current = false;
      // Note: Don't reset sessionErrorRef here to prevent retries on component re-mount
    };
  }, [showID, showSnackbar, retryTrigger]);

  // Manual retry function for when session loading fails
  const retrySessionLoading = useCallback(() => {
    console.log('🔄 Manual retry triggered - resetting all error states');
    sessionErrorRef.current = false;
    sessionRequestRef.current = false;
    setSessionError('');
    setStreamingUrl(''); // This will trigger the loading state
    setRetryTrigger(prev => prev + 1); // Trigger useEffect to run again
  }, []);

  if (loading || (!streamingUrl && !sessionError)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading video stream...
      </Box>
    );
  }

  // Show error state with retry option
  if (sessionError && !streamingUrl) {
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

  console.log('Creating options with showID and streamingUrl:', showID, streamingUrl);

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
