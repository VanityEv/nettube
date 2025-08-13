import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { Box } from '@mui/material';
import { ScreenRecordingDetector } from './security/ScreenRecordingDetector';
import VideoWatermark from './security/VideoWatermark';
import { deviceFingerprinter } from '../services/security/deviceFingerprinting';
import { HttpClient } from '../utils/httpClient';
import { api } from '../constants';

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

  // Rate limiting for security violations to prevent spam
  const violationCooldowns = useRef<Map<string, number>>(new Map());
  const VIOLATION_COOLDOWN = 5000; // 5 seconds cooldown per violation type

  // Handle security events
  const handleSecurityEvent = useCallback(
    async (eventType: string, data: any) => {
      try {
        await HttpClient.post(
          `${api}/videos/security/event`,
          {
            eventType,
            data,
            videoId,
            sessionId,
            timestamp: Date.now(),
          }
        );
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    },
    [videoId, sessionId]
  );

  // Handle security violations with rate limiting
  const handleSecurityViolation = useCallback(
    async (violationType: string) => {
      const now = Date.now();
      const lastViolation = violationCooldowns.current.get(violationType) || 0;

      // Skip if we've reported this violation type recently
      if (now - lastViolation < VIOLATION_COOLDOWN) {
        return;
      }

      violationCooldowns.current.set(violationType, now);

      try {
        await HttpClient.post(
          `${api}/videos/security/watermark/verify`,
          {
            watermarkId: watermarkConfig?.watermarkId,
            sessionId,
            violations: [violationType],
          }
        );
      } catch (error) {
        console.error('Failed to report security violation:', error);
      }
    },
    [watermarkConfig, sessionId, violationCooldowns, VIOLATION_COOLDOWN]
  );

  // Initialize security features
  const initializeSecurity = useCallback(async () => {
    if (!videoId || !sessionId) return;

    try {
      // Generate device fingerprint and send to backend
      const fingerprint = await deviceFingerprinter.generateFingerprint();

      // Get watermark configuration from backend
      const response = await HttpClient.get(`${api}/videos/video/stream/${videoId}`, {
        headers: {
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
  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');

      videoElement.classList.add('vjs-big-play-centered');
      videoElement.classList.add('vjs-16-9');

      // Anti-piracy attributes (allow fullscreen but prevent download and remote playback)
      videoElement.setAttribute('controlsList', 'nodownload noremoteplayback');
      videoElement.setAttribute('disablePictureInPicture', 'true');
      videoElement.addEventListener('contextmenu', e => e.preventDefault());

      // Set explicit CSS styles for proper sizing
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.display = 'block';

      videoRef.current?.appendChild(videoElement);

      const player = (playerRef.current = videojs(
        videoElement,
        {
          ...options,
          // Enable responsive behavior
          fluid: true,
          responsive: true,
          fill: true,
          controls: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          controlBar: {
            ...options.controlBar,
            pictureInPictureToggle: false,
            fullscreenToggle: true, // Enable fullscreen
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

      // Prevent common piracy attempts and add fullscreen monitoring
      player.on('loadstart', () => {
        const videoEl = player.el().querySelector('video');
        if (videoEl) {
          videoEl.setAttribute('controlsList', 'nodownload noremoteplayback');
          videoEl.setAttribute('disablePictureInPicture', 'true');
          videoEl.addEventListener('contextmenu', e => e.preventDefault());
        }
      });

      // Monitor fullscreen events for security logging
      player.on('fullscreenchange', () => {
        const isFullscreen = player.isFullscreen();
        handleSecurityEvent('fullscreen_change', {
          isFullscreen,
          timestamp: Date.now(),
          videoCurrentTime: player.currentTime(),
        });
      });

      // Monitor for suspicious activity
      // Removed obsolete video_paused and video_seeking events

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
  const handleDetection = (type: string, data: any) => {
    console.warn('Suspicious activity detected:', type, data);
    handleSecurityEvent('screen_recording_detection', { type, data });
  };

  const handleViolation = (type: string) => {
    console.warn('Security violation:', type);
    handleSecurityViolation(type);

    // Optionally pause video on serious violations
    if (['screen_capture_device', 'get_display_media', 'excessive_hiding_css'].includes(type)) {
      if (playerRef.current && !playerRef.current.paused()) {
        playerRef.current.pause();
      }
    }
  };

  // Handle watermark violations
  const handleWatermarkViolation = (violation: string) => {
    handleSecurityViolation(violation);
  };

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

  // Handle keyboard shortcuts and disable piracy shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow 'f' key for fullscreen toggle
      if (e.key === 'f' || e.key === 'F') {
        if (playerRef.current) {
          e.preventDefault();
          if (playerRef.current.isFullscreen()) {
            playerRef.current.exitFullscreen();
          } else {
            playerRef.current.requestFullscreen();
          }
          handleSecurityEvent('fullscreen_keyboard_toggle', {
            key: e.key,
            isFullscreen: !playerRef.current.isFullscreen(),
            timestamp: Date.now(),
          });
        }
        return;
      }

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
  }, [handleSecurityViolation, handleSecurityEvent]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <div data-vjs-player style={{ width: '100%', height: '100%' }}>
        <div ref={videoRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Screen Recording Detection */}
      <ScreenRecordingDetector enabled={detectionEnabled} onDetection={handleDetection} onViolation={handleViolation} />

      {/* Dynamic Watermark - absolutely positioned overlay */}
      {watermarkConfig && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <VideoWatermark config={watermarkConfig} sessionId={sessionId || ''} onViolation={handleWatermarkViolation} />
        </Box>
      )}
    </Box>
  );
};

export default VideoJS;
