// Screen Recording Detection (Frontend Component)
// Advanced browser-based screen recording and capture prevention

import { useEffect, useRef, useCallback } from 'react';

interface ScreenRecordingDetectorProps {
  onDetection: (type: string, details: any) => void;
  onViolation: (violation: string, data?: any) => void;
  enabled?: boolean;
}

export const ScreenRecordingDetector: React.FC<ScreenRecordingDetectorProps> = ({
  onDetection,
  onViolation,
  enabled = true,
}) => {
  const detectionIntervalRef = useRef<NodeJS.Timeout>();

  // 1. Media Devices API Detection
  const detectScreenCapture = useCallback(async () => {
    if (!enabled) return;

    try {
      // Check for screen capture devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const screenDevices = devices.filter(
        device =>
          device.label?.toLowerCase().includes('screen') ||
          device.label?.toLowerCase().includes('capture') ||
          device.label?.toLowerCase().includes('obs')
      );

      if (screenDevices.length > 0) {
        onDetection('screen_capture_device', {
          devices: screenDevices.map(d => ({ label: d.label, kind: d.kind })),
          timestamp: Date.now(),
        });
        onViolation('screen_capture_device');
      }
    } catch (error) {
      console.warn('Screen capture detection failed:', error);
    }
  }, [enabled, onDetection, onViolation]);

  // Enhanced DOM Manipulation Detection with smart filtering
  const detectDOMManipulation = useCallback(() => {
    if (!enabled) return;

    let mutationCount = 0;
    let suspiciousMutationCount = 0;
    const mutationWindow = 5000; // 5 second window
    let windowStart = Date.now();

    const observer = new MutationObserver(mutations => {
      const now = Date.now();

      // Reset counter every 5 seconds
      if (now - windowStart > mutationWindow) {
        mutationCount = 0;
        suspiciousMutationCount = 0;
        windowStart = now;
      }

      mutations.forEach(mutation => {
        const target = mutation.target as Element;

        // Skip watermark-related legitimate updates
        if (
          target.closest('[data-watermark]') ||
          target.classList?.contains('video-watermark') ||
          target.id?.includes('watermark')
        ) {
          return; // Don't count watermark updates
        }

        mutationCount++;

        // Check for suspicious style changes (hiding elements)
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const style = target.getAttribute('style');

          if (
            style?.includes('display: none') ||
            style?.includes('visibility: hidden') ||
            style?.includes('opacity: 0')
          ) {
            suspiciousMutationCount++;
            onDetection('element_hidden', {
              element: target.tagName,
              className: target.className,
              style,
              timestamp: now,
            });
          }
        }

        // Check for suspicious element removal
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.tagName === 'VIDEO' ||
                element.classList?.contains('video-js') ||
                element.closest('.video-container')
              ) {
                suspiciousMutationCount += 5; // Video manipulation is highly suspicious
                onDetection('video_element_removed', {
                  element: element.tagName,
                  className: element.className,
                  timestamp: now,
                });
              }
            }
          });
        }
      });

      // Adjusted thresholds for better detection
      if (mutationCount > 200) {
        // Increased threshold for total mutations
        onViolation('excessive_dom_manipulation', {
          mutationCount,
          suspiciousMutationCount,
          timeWindow: mutationWindow,
          timestamp: now,
        });
        mutationCount = 0;
        suspiciousMutationCount = 0;
      }

      // Lower threshold for clearly suspicious activities
      if (suspiciousMutationCount > 10) {
        onViolation('suspicious_dom_manipulation', {
          suspiciousMutationCount,
          mutationCount,
          timeWindow: mutationWindow,
          timestamp: now,
        });
        suspiciousMutationCount = 0;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => observer.disconnect();
  }, [enabled, onDetection, onViolation]);

  // 3. Visibility Detection
  const detectVisibilityChanges = useCallback(() => {
    if (!enabled) return;

    let hiddenCount = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenCount++;
        onDetection('page_hidden', {
          count: hiddenCount,
          timestamp: Date.now(),
        });

        if (hiddenCount > 5) {
          onViolation('frequent_page_hiding');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, onDetection, onViolation]);

  // Main detection effect
  useEffect(() => {
    if (!enabled) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      return;
    }

    // Start detection methods
    detectScreenCapture();
    const domCleanup = detectDOMManipulation();
    const visibilityCleanup = detectVisibilityChanges();

    // Periodic detection
    detectionIntervalRef.current = setInterval(detectScreenCapture, 5000);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      domCleanup?.();
      visibilityCleanup?.();
    };
  }, [enabled, detectScreenCapture, detectDOMManipulation, detectVisibilityChanges]);

  // This component doesn't render anything
  return null;
};

export default ScreenRecordingDetector;
