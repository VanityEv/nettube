import React from 'react';
import VideoCard from './VideoCard';
import EmptyState from './EmptyState';
import ErrorBoundary from './ErrorBoundary';
import { safeArray, isValidArray, safeString } from '../helpers/safeData';
import './SafeVideoList.css';

interface Video {
  id?: string | number;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  views?: number;
  rating?: number;
  uploadDate?: string;
  author?: string;
  url?: string;
  type?: string;
  genre?: string;
  production_year?: number;
  director?: string;
  grade?: number;
}

// Type guard to ensure video object is valid
const isValidVideo = (video: any): video is Video => {
  return video && typeof video === 'object' && !Array.isArray(video);
};

// Convert any video object to safe video format matching VideoCard props
const toSafeVideo = (
  video: any
): {
  id: string;
  title: string;
  type: 'film' | 'series';
  genre?: string;
  production_year?: number;
  director?: string;
  thumbnail?: string;
  grade?: number;
  views?: number;
} => {
  if (!isValidVideo(video)) {
    return {
      id: 'unknown',
      title: 'Unknown Video',
      type: 'film',
    };
  }

  const videoType = safeString((video as any).type, 'film');
  const validType = videoType === 'series' ? 'series' : 'film';

  return {
    id: safeString((video as any).id || (video as any)._id || 'unknown'),
    title: safeString(video.title, 'Unknown Video'),
    type: validType,
    genre: video.genre ? safeString(video.genre) : undefined,
    production_year: video.production_year || (video as any).year || undefined,
    director: video.director ? safeString(video.director) : undefined,
    thumbnail: video.thumbnail ? safeString(video.thumbnail) : undefined,
    grade: (video as any).grade || video.rating || undefined,
    views: video.views || undefined,
  };
};

interface SafeVideoListProps {
  videos?: Video[] | null;
  loading?: boolean;
  error?: string | null;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  onVideoClick?: (videoId: string) => void;
  onRetry?: () => void;
}

const SafeVideoList: React.FC<SafeVideoListProps> = ({
  videos,
  loading = false,
  error = null,
  emptyStateTitle,
  emptyStateDescription,
  onVideoClick,
  onRetry,
}) => {
  // Handle loading state
  if (loading) {
    return (
      <div className="safe-video-list">
        <EmptyState
          type="loading"
          title="Loading Videos..."
          description="Please wait while we fetch the latest videos."
        />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="safe-video-list">
        <EmptyState
          type="error"
          title="Failed to Load Videos"
          description={error}
          actionText={onRetry ? 'Try Again' : undefined}
          onAction={onRetry}
        />
      </div>
    );
  }

  // Safe array conversion
  const safeVideos = safeArray(videos);

  // Handle empty state
  if (!isValidArray(safeVideos)) {
    return (
      <div className="safe-video-list">
        <EmptyState
          type="videos"
          title={emptyStateTitle}
          description={emptyStateDescription}
          actionText={onRetry ? 'Refresh' : undefined}
          onAction={onRetry}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <EmptyState
          type="error"
          title="Error Displaying Videos"
          description="There was an error rendering the video list."
          actionText={onRetry ? 'Try Again' : undefined}
          onAction={onRetry}
        />
      }
    >
      <div className="safe-video-list">
        <div className="video-grid">
          {safeVideos.map((video, index) => {
            const safeVideo = toSafeVideo(video);
            return (
              <ErrorBoundary
                key={safeVideo.id || `video-${index}`}
                fallback={
                  <div className="video-card-error">
                    <p>Error loading video #{index + 1}</p>
                  </div>
                }
              >
                <VideoCard video={safeVideo} onClick={onVideoClick ? () => onVideoClick(safeVideo.id) : undefined} />
              </ErrorBoundary>
            );
          })}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SafeVideoList;
