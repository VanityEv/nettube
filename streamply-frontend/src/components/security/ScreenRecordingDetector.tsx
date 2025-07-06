// Screen Recording Detection (Frontend Component)
// Advanced browser-based screen recording and capture prevention

import { useState, useEffect, useRef, useCallback } from 'react';

interface ScreenRecordingDetectorProps {
  onDetection: (type: string, details: any) => void;
  onViolation: (violation: string) => void;
  enabled?: boolean;
}

export const ScreenRecordingDetector: React.FC<ScreenRecordingDetectorProps> = ({
  onDetection,
  onViolation,
  enabled = true,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
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

  // 2. DOM Manipulation Detection
  const detectDOMManipulation = useCallback(() => {
    if (!enabled) return;

    let mutationCount = 0;
    const observer = new MutationObserver(mutations => {
      mutationCount += mutations.length;

      mutations.forEach(mutation => {
        // Check for suspicious style changes (hiding elements)
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as Element;
          const style = target.getAttribute('style');

          if (
            style?.includes('display: none') ||
            style?.includes('visibility: hidden') ||
            style?.includes('opacity: 0')
          ) {
            onDetection('element_hidden', {
              element: target.tagName,
              style,
              timestamp: Date.now(),
            });
          }
        }
      });

      // Too many mutations might indicate recording software manipulation
      if (mutationCount > 100) {
        onViolation('excessive_dom_manipulation');
        mutationCount = 0;
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
