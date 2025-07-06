import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { Box } from '@mui/material';
import { ScreenRecordingDetector } from './security/ScreenRecordingDetector';
import VideoWatermark from './security/VideoWatermark';
import { deviceFingerprinter } from '../services/security/deviceFingerprinting';
import axios from 'axios';
import { api } from '../constants';
import { getCookie } from 'typescript-cookie';

interface VideoJSProps {
  options: any;
  onReady?: (player: Player) => void;
  videoId?: string;
  sessionId?: string;
}

//@ts-ignore
export const VideoJS = ({ options, onReady, videoId, sessionId }: VideoJSProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [watermarkConfig, setWatermarkConfig] = useState<any>(null);
  const [detectionEnabled] = useState(true);

  // Handle security events
  const handleSecurityEvent = useCallback(
    async (eventType: string, data: any) => {
      try {
        await axios.post(
          `${api}/videos/security/event`,
          {
            eventType,
            data,
            videoId,
            sessionId,
            timestamp: Date.now(),
          },
          {
            headers: { Authorization: `Bearer ${getCookie('userToken')}` },
          }
        );
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    },
    [videoId, sessionId]
  );

  // Handle security violations
  const handleSecurityViolation = useCallback(
    async (violationType: string) => {
      try {
        await axios.post(
          `${api}/videos/security/watermark/verify`,
          {
            watermarkId: watermarkConfig?.watermarkId,
            sessionId,
            violations: [violationType],
          },
          {
            headers: { Authorization: `Bearer ${getCookie('userToken')}` },
          }
        );
      } catch (error) {
        console.error('Failed to report security violation:', error);
      }
    },
    [watermarkConfig, sessionId]
  );

  // Initialize security features
  const initializeSecurity = useCallback(async () => {
    if (!videoId || !sessionId) return;

    try {
      // Generate device fingerprint and send to backend
      const fingerprint = await deviceFingerprinter.generateFingerprint();

      // Get watermark configuration from backend
      const response = await axios.get(`${api}/videos/video/stream/${videoId}`, {
        headers: {
          Authorization: `Bearer ${getCookie('userToken')}`,
          'X-Device-Fingerprint': fingerprint,
        },
      });

      if (response.data.result === 'SUCCESS') {
        setWatermarkConfig(response.data.watermark);
      }
    } catch (error) {
      console.error('Failed to initialize video security:', error);
    }
  }, [videoId, sessionId]);

  // Initialize player with anti-piracy controls
  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');

      videoElement.classList.add('vjs-big-play-centered');
      videoElement.classList.add('vjs-16-9');

      // Anti-piracy attributes
      videoElement.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
      videoElement.setAttribute('disablePictureInPicture', 'true');
      videoElement.addEventListener('contextmenu', e => e.preventDefault());

      videoRef.current?.appendChild(videoElement);

      const player = (playerRef.current = videojs(
        videoElement,
        {
          ...options,
          // Disable problematic features
          fluid: true,
          responsive: true,
          controls: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          controlBar: {
            ...options.controlBar,
            pictureInPictureToggle: false,
            fullscreenToggle: false, // Disable fullscreen
            downloadButton: false,
          },
          // Additional security options
          techOrder: ['html5'],
          html5: {
            vhs: {
              enableLowInitialPlaylist: true,
              smoothQualityChange: true,
              allowSeeksWithinUnsafeLiveWindow: false,
            },
          },
        },
        () => {
          onReady && onReady(player);
          initializeSecurity();
        }
      ));

      // Prevent common piracy attempts
      player.on('loadstart', () => {
        const videoEl = player.el().querySelector('video');
        if (videoEl) {
          videoEl.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
          videoEl.setAttribute('disablePictureInPicture', 'true');
          videoEl.addEventListener('contextmenu', e => e.preventDefault());
        }
      });

      // Monitor for suspicious activity
      player.on('pause', () => {
        handleSecurityEvent('video_paused', { timestamp: Date.now() });
      });

      player.on('seeking', () => {
        handleSecurityEvent('video_seeking', {
          currentTime: player.currentTime(),
          timestamp: Date.now(),
        });
      });

      // Prevent right-click context menu
      player.el().addEventListener('contextmenu', e => {
        e.preventDefault();
        handleSecurityViolation('context_menu_attempt');
      });
    } else {
      const player = playerRef.current;

      if (player) {
        player.autoplay(options.autoplay);
        player.src(options.sources);
      }
    }
  }, [options, videoRef, onReady, handleSecurityEvent, handleSecurityViolation, initializeSecurity]);

  // Handle screen recording detection
  const handleDetection = useCallback(
    (type: string, data: any) => {
      console.warn('Suspicious activity detected:', type, data);
      handleSecurityEvent('screen_recording_detection', { type, data });
    },
    [handleSecurityEvent]
  );

  const handleViolation = useCallback(
    (type: string) => {
      console.warn('Security violation:', type);
      handleSecurityViolation(type);

      // Optionally pause video on serious violations
      if (['screen_capture_device', 'get_display_media', 'excessive_hiding_css'].includes(type)) {
        if (playerRef.current && !playerRef.current.paused()) {
          playerRef.current.pause();
        }
      }
    },
    [handleSecurityViolation]
  );

  // Handle watermark violations
  const handleWatermarkViolation = useCallback(
    (violation: string) => {
      handleSecurityViolation(violation);
    },
    [handleSecurityViolation]
  );

  // Cleanup
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  // Disable common keyboard shortcuts that could be used for piracy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        handleSecurityViolation('developer_tools_attempt');
      }
      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        handleSecurityViolation('developer_tools_attempt');
      }
      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        handleSecurityViolation('view_source_attempt');
      }
      // Disable Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSecurityViolation('save_attempt');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSecurityViolation]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <div data-vjs-player>
        <div ref={videoRef} />
      </div>

      {/* Screen Recording Detection */}
      <ScreenRecordingDetector enabled={detectionEnabled} onDetection={handleDetection} onViolation={handleViolation} />

      {/* Dynamic Watermark */}
      {watermarkConfig && (
        <VideoWatermark config={watermarkConfig} sessionId={sessionId || ''} onViolation={handleWatermarkViolation} />
      )}
    </Box>
  );
};

export default VideoJS;
