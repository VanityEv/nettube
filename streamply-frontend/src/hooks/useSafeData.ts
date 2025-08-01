import { useState, useEffect } from 'react';

interface VideoData {
  id: string;
  title: string;
  type: 'film' | 'series';
  genre?: string;
  production_year?: number;
  production_country?: string;
  director?: string;
  tags?: string;
  descr?: string;
  thumbnail?: string;
  grade?: number;
  reviews_count?: number;
  views?: number;
  link?: string;
  blocked_reviews?: boolean;
}

interface SafeVideoData extends VideoData {
  thumbnail: string;
  genre: string;
  production_year: number;
  production_country: string;
  director: string;
  tags: string;
  descr: string;
  grade: number;
  reviews_count: number;
  views: number;
  link: string;
}

// Utility function to provide safe defaults for video data
export function useSafeVideoData(videoData: VideoData | null): SafeVideoData | null {
  const [safeData, setSafeData] = useState<SafeVideoData | null>(null);

  useEffect(() => {
    if (!videoData) {
      setSafeData(null);
      return;
    }

    const getDefaultThumbnail = (type: 'film' | 'series'): string => {
      const baseStyle = '300x445';
      const bgColor = type === 'series' ? '1a1a2e' : '16213e';
      const textColor = 'ffffff';
      const text = type === 'series' ? 'TV+Series' : 'Movie';
      
      return `https://via.placeholder.com/${baseStyle}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
    };

    const safe: SafeVideoData = {
      ...videoData,
      thumbnail: videoData.thumbnail && videoData.thumbnail.trim() 
        ? videoData.thumbnail 
        : getDefaultThumbnail(videoData.type),
      genre: videoData.genre || 'Unknown',
      production_year: videoData.production_year || new Date().getFullYear(),
      production_country: videoData.production_country || 'Unknown',
      director: videoData.director || 'Unknown Director',
      tags: videoData.tags || '',
      descr: videoData.descr || 'No description available.',
      grade: videoData.grade || 0,
      reviews_count: videoData.reviews_count || 0,
      views: videoData.views || 0,
      link: videoData.link || '',
      blocked_reviews: videoData.blocked_reviews || false
    };

    setSafeData(safe);
  }, [videoData]);

  return safeData;
}

// Utility function for safe string display
export function safeString(value: string | null | undefined, fallback: string = 'N/A'): string {
  return value && value.trim() ? value : fallback;
}

// Utility function for safe number display
export function safeNumber(value: number | null | undefined, fallback: number = 0): number {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
}

// Utility function for safe URL handling
export function safeUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  
  try {
    // Basic URL validation
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url); // This will throw if invalid
      return url;
    }
    // Handle relative URLs or YouTube embeds
    if (url.startsWith('/') || url.includes('youtube.com') || url.includes('youtu.be')) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

// Utility function for safe image URLs
export function safeImageUrl(
  url: string | null | undefined, 
  type: 'film' | 'series' = 'film'
): string {
  if (url && url.trim()) {
    try {
      new URL(url);
      return url;
    } catch {
      // If URL is invalid, fall back to placeholder
    }
  }
  
  const baseStyle = '300x445';
  const bgColor = type === 'series' ? '1a1a2e' : '16213e';
  const textColor = 'ffffff';
  const text = type === 'series' ? 'TV+Series' : 'Movie';
  
  return `https://via.placeholder.com/${baseStyle}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
}

// Format year display
export function formatYear(year: number | null | undefined): string {
  const safeYear = safeNumber(year, new Date().getFullYear());
  return safeYear.toString();
}

// Format rating display
export function formatRating(rating: number | null | undefined): string {
  const safeRating = safeNumber(rating, 0);
  return safeRating > 0 ? safeRating.toFixed(1) : 'No rating';
}

// Format view count
export function formatViews(views: number | null | undefined): string {
  const safeViews = safeNumber(views, 0);
  
  if (safeViews >= 1000000) {
    return `${(safeViews / 1000000).toFixed(1)}M views`;
  } else if (safeViews >= 1000) {
    return `${(safeViews / 1000).toFixed(1)}K views`;
  } else {
    return `${safeViews} views`;
  }
}

const safeDataUtils = {
  useSafeVideoData,
  safeString,
  safeNumber,
  safeUrl,
  safeImageUrl,
  formatYear,
  formatRating,
  formatViews
};

export default safeDataUtils;
