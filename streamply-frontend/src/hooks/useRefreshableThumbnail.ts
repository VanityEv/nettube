// Custom hook to automatically refresh expired B2 thumbnail URLs
// This ensures admin panel thumbnails always load correctly

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { api } from '../constants';

// Global cache to prevent multiple refresh attempts for the same file
// Use file path as key instead of full URL to deduplicate different signed URLs of the same file
const refreshCache = new Map<string, Promise<string>>();
const successCache = new Map<string, string>();

// Extract file path from B2 URL for caching
const extractFilePath = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Extract path after /file/bucket-name/
    const pathMatch = urlObj.pathname.match(/\/file\/[^/]+\/(.+)/);
    return pathMatch ? pathMatch[1] : url;
  } catch {
    return url;
  }
};

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

    // Use file path as cache key to deduplicate different signed URLs of the same file
    const filePath = extractFilePath(originalUrl);
    
    // Check if we already have a successful refresh for this file
    if (successCache.has(filePath)) {
      const cachedUrl = successCache.get(filePath)!;
      setThumbnailUrl(cachedUrl);
      setHasTriedRefresh(true);
      return;
    }

    // Check if there's already a refresh in progress for this file
    if (refreshCache.has(filePath)) {
      try {
        const refreshedUrl = await refreshCache.get(filePath)!;
        setThumbnailUrl(refreshedUrl);
        setHasTriedRefresh(true);
        return;
      } catch (error) {
        console.error('Failed to get cached refresh result:', error);
        setError('Failed to load thumbnail');
        setHasTriedRefresh(true);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    // Create a promise for this refresh operation and cache it
    const refreshPromise = (async () => {
      try {
        const response = await axios.post(`${api}/thumbnails/refresh`, {
          url: originalUrl
        });

        if (response.data.refreshedUrl) {
          // Cache the successful result using file path
          successCache.set(filePath, response.data.refreshedUrl);
          return response.data.refreshedUrl;
        } else {
          throw new Error('No refreshed URL in response');
        }
      } catch (error) {
        console.error(`❌ Failed to refresh thumbnail ${filePath}:`, error);
        throw error;
      } finally {
        // Remove from active refresh cache
        refreshCache.delete(filePath);
      }
    })();

    // Cache the promise to prevent duplicate requests
    refreshCache.set(filePath, refreshPromise);

    try {
      const refreshedUrl = await refreshPromise;
      setThumbnailUrl(refreshedUrl);
      setHasTriedRefresh(true);
    } catch (error) {
      console.error('Failed to refresh thumbnail URL:', error);
      setError('Failed to load thumbnail');
      setHasTriedRefresh(true);
    } finally {
      setIsLoading(false);
    }
  }, [originalUrl, hasTriedRefresh]);

  useEffect(() => {
    // Reset state when originalUrl changes
    setThumbnailUrl(originalUrl);
    setHasTriedRefresh(false);
    setError(null);
    
    // Check if we already have a cached successful refresh for this file
    const filePath = extractFilePath(originalUrl);
    if (successCache.has(filePath)) {
      const cachedUrl = successCache.get(filePath)!;
      setThumbnailUrl(cachedUrl);
      setHasTriedRefresh(true);
      return;
    }
  }, [originalUrl]);

  useEffect(() => {
    // Don't test the image if we're using a cached URL or if refresh is in progress
    const filePath = extractFilePath(originalUrl);
    if (successCache.has(filePath) || refreshCache.has(filePath)) {
      return;
    }

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
        // Add a small delay to prevent immediate refresh attempts
        setTimeout(() => {
          refreshThumbnail();
        }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
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
  }, [thumbnailUrl, hasTriedRefresh, refreshThumbnail, originalUrl]);

  return { thumbnailUrl, isLoading, error };
};
