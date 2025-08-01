// Custom hook to automatically refresh expired B2 thumbnail URLs
// This ensures admin panel thumbnails always load correctly

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { api } from '../constants';

export const useRefreshableThumbnail = (originalUrl: string) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(originalUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  const refreshThumbnail = useCallback(async () => {
    // Only refresh if it's a B2 URL and we haven't tried refreshing yet
    if (!originalUrl || !originalUrl.includes('backblazeb2.com') || hasTriedRefresh) {
      return;
    }

    console.log('Attempting to refresh thumbnail:', originalUrl);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${api}/thumbnails/refresh`, {
        url: originalUrl
      });

      if (response.data.refreshedUrl) {
        setThumbnailUrl(response.data.refreshedUrl);
        setHasTriedRefresh(true);
      }
    } catch (error) {
      console.error('Failed to refresh thumbnail URL:', error);
      setError('Failed to load thumbnail');
      setHasTriedRefresh(true); // Don't keep trying if refresh fails
    } finally {
      setIsLoading(false);
    }
  }, [originalUrl, hasTriedRefresh]);

  useEffect(() => {
    // Reset state when originalUrl changes
    setThumbnailUrl(originalUrl);
    setHasTriedRefresh(false);
    setError(null);
  }, [originalUrl]);

  useEffect(() => {
    // Test if the current thumbnail URL loads
    const img = new Image();
    let timeoutId: NodeJS.Timeout;
    
    img.onload = () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setError(null);
    };
    
    img.onerror = (event) => {
            
      clearTimeout(timeoutId);
      if (!hasTriedRefresh) {
        refreshThumbnail();
      } else {
        setIsLoading(false);
        setError('Failed to load thumbnail');
      }
    };
    
    // Set a timeout to handle cases where the image never triggers onload or onerror
    timeoutId = setTimeout(() => {
      if (!hasTriedRefresh) {
        refreshThumbnail();
      } else {
        setIsLoading(false);
        setError('Thumbnail load timeout');
      }
    }, 10000); // 10 second timeout
    
    setIsLoading(true);
    img.src = thumbnailUrl;

    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [thumbnailUrl, hasTriedRefresh, refreshThumbnail]);

  return { thumbnailUrl, isLoading, error };
};
