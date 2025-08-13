// Video Watermarking Component
// Dynamic user-specific watermarks with forensic tracking

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  onViolation?: (violation: string, data?: any) => void;
}

export const VideoWatermark: React.FC<VideoWatermarkProps> = ({ config, sessionId, onViolation }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentText, setCurrentText] = useState(config.text);
  const [currentPosition, setCurrentPosition] = useState(config.style);
  const intervalRef = useRef<NodeJS.Timeout>();
  const watermarkRef = useRef<HTMLDivElement>(null);
  const mutationObserverRef = useRef<MutationObserver>();

  // Rate limiting for violation reporting with better structure
  const violationCooldowns = useRef<Map<string, number>>(new Map());
  const VIOLATION_COOLDOWN = 10000; // 10 seconds cooldown per violation type
  const isUpdatingPosition = useRef<boolean>(false); // Track legitimate updates

  // Enhanced violation reporting with more context
  const reportViolation = useCallback(
    (violationType: string, additionalData?: any) => {
      const now = Date.now();
      const lastViolation = violationCooldowns.current.get(violationType) || 0;

      // Skip if we've reported this violation type recently
      if (now - lastViolation < VIOLATION_COOLDOWN) {
        return;
      }

      // Don't report violations during legitimate watermark updates
      if (isUpdatingPosition.current && violationType === 'watermark_style_modified') {
        return;
      }

      violationCooldowns.current.set(violationType, now);
      
      // Enhanced violation data
      const violationData = {
        violationType,
        timestamp: now,
        watermarkId: config.watermarkId,
        sessionId,
        userAgent: navigator.userAgent,
        windowSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        ...additionalData
      };

      onViolation?.(violationType, violationData);
    },
    [onViolation, VIOLATION_COOLDOWN, config.watermarkId, sessionId]
  );

  // Positions for dynamic movement with subtle visibility - contained within video
  const positions = useMemo(
    () => [
      { top: '8%', left: '8%', opacity: 0.15 }, // Much more subtle
      { top: '8%', right: '8%', opacity: 0.15 }, // Much more subtle
      { bottom: '20%', left: '8%', opacity: 0.15 }, // Account for video controls, more subtle
      { bottom: '20%', right: '8%', opacity: 0.15 }, // Account for video controls, more subtle
      { top: '50%', left: '50%', opacity: 0.1, transform: 'translate(-50%, -50%)' }, // Very subtle center
      { top: '20%', left: '70%', opacity: 0.12 }, // Very subtle
      { bottom: '30%', right: '20%', opacity: 0.12 }, // Very subtle, well above controls
    ],
    []
  );

  // Generate timestamp-based variations
  const generateTimestampText = useCallback(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${config.text} • ${timeStr}`;
  }, [config.text]);

  // Update watermark position and text dynamically
  const updateWatermark = useCallback(() => {
    if (!config.enabled) return;

    // Mark as legitimate update
    isUpdatingPosition.current = true;

    // Rotate through positions more frequently for short videos
    const effectiveInterval = Math.min(config.updateInterval, 15000); // Max 15 seconds for position changes
    const positionIndex = Math.floor(Date.now() / effectiveInterval) % positions.length;
    const newPosition = { ...config.style, ...positions[positionIndex] };

    // Update text with timestamp
    const newText = generateTimestampText();

    setCurrentPosition(newPosition);
    setCurrentText(newText);

    // Brief fade effect for visibility
    setIsVisible(false);
    
    setTimeout(() => {
      setIsVisible(true);
      // Clear legitimate update flag after transition
      setTimeout(() => {
        isUpdatingPosition.current = false;
      }, 500); // Give enough time for DOM updates
    }, Math.min(config.fadeTransition / 4, 200)); // Max 200ms fade
  }, [config.enabled, config.updateInterval, config.style, config.fadeTransition, positions, generateTimestampText]);

  // Enhanced tampering detection with better context
  const detectTampering = useCallback(() => {
    if (!watermarkRef.current) return;

    const element = watermarkRef.current;
    const computedStyle = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    // Check for hidden watermark
    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      parseFloat(computedStyle.opacity) === 0
    ) {
      reportViolation('watermark_hidden', {
        computedStyle: {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity
        },
        detectionMethod: 'computed_style_check'
      });
    }

    // Check for removed/moved watermark
    if (rect.width === 0 || rect.height === 0) {
      reportViolation('watermark_removed', {
        boundingRect: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        detectionMethod: 'bounding_rect_check'
      });
    }

    // Check for modified content
    if (element.textContent !== currentText) {
      reportViolation('watermark_content_modified', {
        expectedText: currentText,
        actualText: element.textContent,
        textLength: element.textContent?.length || 0,
        detectionMethod: 'content_comparison'
      });
    }

    // Check for suspicious positioning (outside video area)
    const videoElement = element.closest('video') || element.closest('.video-js');
    if (videoElement) {
      const videoRect = videoElement.getBoundingClientRect();
      if (
        rect.left < videoRect.left ||
        rect.top < videoRect.top ||
        rect.right > videoRect.right ||
        rect.bottom > videoRect.bottom
      ) {
        reportViolation('watermark_repositioned_outside_video', {
          watermarkRect: rect,
          videoRect: videoRect,
          detectionMethod: 'position_boundary_check'
        });
      }
    }
  }, [reportViolation, currentText]);

  // Enhanced mutation observer with smart filtering
  useEffect(() => {
    if (!watermarkRef.current || !config.enabled) return;

    const observer = new MutationObserver(mutations => {
      // Skip if we're doing legitimate updates
      if (isUpdatingPosition.current) return;

      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          // Only report unauthorized style modifications
          if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
            const target = mutation.target as HTMLElement;
            const oldValue = mutation.oldValue;
            const newValue = mutation.attributeName === 'style' 
              ? target.getAttribute('style') 
              : target.getAttribute('class');
            
            reportViolation('watermark_unauthorized_style_change', {
              attributeName: mutation.attributeName,
              oldValue,
              newValue,
              detectionMethod: 'mutation_observer',
              suspiciousChange: true
            });
          }
        } else if (mutation.type === 'childList') {
          // Report content removal/addition
          if (mutation.removedNodes.length > 0) {
            reportViolation('watermark_content_removed', {
              removedNodesCount: mutation.removedNodes.length,
              detectionMethod: 'mutation_observer'
            });
          }
          if (mutation.addedNodes.length > 0) {
            reportViolation('watermark_content_added', {
              addedNodesCount: mutation.addedNodes.length,
              detectionMethod: 'mutation_observer'
            });
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
  }, [config.enabled, reportViolation]);

  // Set up periodic updates and tampering detection
  useEffect(() => {
    if (!config.enabled) return;

    // Initial update - show watermark immediately
    updateWatermark();

    // Set up periodic updates - more frequent for short videos
    const effectiveInterval = Math.min(config.updateInterval, 15000); // Update at least every 15 seconds
    intervalRef.current = setInterval(() => {
      updateWatermark();
      detectTampering();
    }, effectiveInterval);

    // Set up tampering detection (less frequent to reduce spam)
    const tamperingInterval = setInterval(detectTampering, 60000); // Every 60 seconds instead of 30

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(tamperingInterval);
    };
  }, [config.enabled, config.updateInterval, detectTampering, updateWatermark]);

  // Prevent context menu on watermark
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    reportViolation('watermark_context_menu');
  };

  // Prevent selection
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    reportViolation('watermark_interaction_attempt');
  };

  if (!config.enabled) return null;

  return (
    <Box
      ref={watermarkRef}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      className="video-watermark"
      data-watermark="true"
      data-watermark-id={config.watermarkId}
      data-session-id={sessionId}
      sx={{
        position: 'absolute',
        top: currentPosition.top,
        left: currentPosition.left,
        right: currentPosition.right,
        bottom: currentPosition.bottom,
        transform: `${currentPosition.transform || ''} rotate(${config.rotation}deg)`,
        transition: `opacity ${config.fadeTransition / 1000}s ease-in-out`,
        opacity: isVisible ? currentPosition.opacity : 0,
        cursor: 'default',
        pointerEvents: 'auto',
        zIndex: 1001,
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
