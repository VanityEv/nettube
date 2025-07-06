// Video Watermarking Component
// Dynamic user-specific watermarks with forensic tracking

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface WatermarkConfig {
  enabled: boolean;
  watermarkId: string;
  text: string;
  style: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    opacity: number;
    fontSize: string;
    color: string;
    fontFamily: string;
    fontWeight: string;
    textShadow: string;
    pointerEvents: string;
    userSelect: string;
    zIndex: number;
    position: string;
    transform?: string;
  };
  rotation: number;
  updateInterval: number;
  fadeTransition: number;
}

interface VideoWatermarkProps {
  config: WatermarkConfig;
  sessionId: string;
  onViolation?: (violation: string) => void;
}

export const VideoWatermark: React.FC<VideoWatermarkProps> = ({ config, sessionId, onViolation }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentText, setCurrentText] = useState(config.text);
  const [currentPosition, setCurrentPosition] = useState(config.style);
  const intervalRef = useRef<NodeJS.Timeout>();
  const watermarkRef = useRef<HTMLDivElement>(null);
  const mutationObserverRef = useRef<MutationObserver>();

  // Positions for dynamic movement
  const positions = [
    { top: '10%', left: '10%', opacity: 0.3 },
    { top: '10%', right: '10%', opacity: 0.3 },
    { bottom: '10%', left: '10%', opacity: 0.3 },
    { bottom: '10%', right: '10%', opacity: 0.3 },
    { top: '50%', left: '50%', opacity: 0.2, transform: 'translate(-50%, -50%)' },
    { top: '20%', left: '80%', opacity: 0.25 },
    { bottom: '20%', right: '20%', opacity: 0.25 },
  ];

  // Generate timestamp-based variations
  const generateTimestampText = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${config.text} • ${timeStr}`;
  };

  // Update watermark position and text dynamically
  const updateWatermark = () => {
    if (!config.enabled) return;

    // Rotate through positions
    const positionIndex = Math.floor(Date.now() / config.updateInterval) % positions.length;
    const newPosition = { ...config.style, ...positions[positionIndex] };

    // Update text with timestamp
    const newText = generateTimestampText();

    setCurrentPosition(newPosition);
    setCurrentText(newText);

    // Brief fade effect
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), config.fadeTransition / 4);
  };

  // Detect tampering attempts
  const detectTampering = () => {
    if (!watermarkRef.current) return;

    const element = watermarkRef.current;
    const computedStyle = window.getComputedStyle(element);

    // Check for hidden watermark
    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      parseFloat(computedStyle.opacity) === 0
    ) {
      onViolation?.('watermark_hidden');
    }

    // Check for moved watermark
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      onViolation?.('watermark_removed');
    }

    // Check for modified content
    if (element.textContent !== currentText) {
      onViolation?.('watermark_modified');
    }
  };

  // Set up mutation observer to detect DOM tampering
  useEffect(() => {
    if (!watermarkRef.current || !config.enabled) return;

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          // Check for style modifications
          if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
            onViolation?.('watermark_style_modified');
          }
        } else if (mutation.type === 'childList') {
          // Check for content modifications
          if (mutation.removedNodes.length > 0) {
            onViolation?.('watermark_content_removed');
          }
        }
      });
    });

    observer.observe(watermarkRef.current, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
    });

    mutationObserverRef.current = observer;

    return () => observer.disconnect();
  }, [config.enabled, onViolation]);

  // Set up periodic updates and tampering detection
  useEffect(() => {
    if (!config.enabled) return;

    // Initial update
    updateWatermark();

    // Set up periodic updates
    intervalRef.current = setInterval(() => {
      updateWatermark();
      detectTampering();
    }, config.updateInterval);

    // Set up tampering detection
    const tamperingInterval = setInterval(detectTampering, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(tamperingInterval);
    };
  }, [config.enabled, config.updateInterval]);

  // Prevent context menu on watermark
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onViolation?.('watermark_context_menu');
  };

  // Prevent selection
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onViolation?.('watermark_interaction_attempt');
  };

  if (!config.enabled) return null;

  return (
    <Box
      ref={watermarkRef}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      sx={{
        ...currentPosition,
        transition: `opacity ${config.fadeTransition / 1000}s ease-in-out`,
        opacity: isVisible ? currentPosition.opacity : 0,
        transform: `${currentPosition.transform || ''} rotate(${config.rotation}deg)`,
        cursor: 'default',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        // Prevent watermark from being draggable
        WebkitUserDrag: 'none',
        KhtmlUserDrag: 'none',
        MozUserDrag: 'none',
        OUserDrag: 'none',
        userDrag: 'none',
        // Anti-tampering CSS
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          pointerEvents: 'none',
        },
      }}
      data-watermark-id={config.watermarkId}
      data-session-id={sessionId}
    >
      <Typography
        component="span"
        sx={{
          fontSize: currentPosition.fontSize || config.style.fontSize,
          color: currentPosition.color || config.style.color,
          fontFamily: currentPosition.fontFamily || config.style.fontFamily,
          fontWeight: currentPosition.fontWeight || config.style.fontWeight,
          textShadow: currentPosition.textShadow || config.style.textShadow,
          whiteSpace: 'nowrap',
          // Additional anti-tampering
          WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
          filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.8))',
        }}
      >
        {currentText}
      </Typography>
    </Box>
  );
};

export default VideoWatermark;
