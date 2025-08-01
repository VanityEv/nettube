import React from 'react';
import VideoThumbnail from './VideoThumbnail';
import { safeString, formatYear, formatRating, formatViews } from '../hooks/useSafeData';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    type: 'film' | 'series';
    genre?: string;
    production_year?: number;
    director?: string;
    thumbnail?: string;
    grade?: number;
    views?: number;
  };
  onClick?: (id: string) => void;
  className?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, className = '' }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(video.id);
    }
  };

  return (
    <div
      className={`video-card ${className}`}
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="video-card__thumbnail">
        <VideoThumbnail src={video.thumbnail} alt={video.title} type={video.type} className="video-card__image" />
        {video.grade && video.grade > 0 && <div className="video-card__rating">⭐ {formatRating(video.grade)}</div>}
      </div>

      <div className="video-card__content">
        <h3 className="video-card__title" title={video.title}>
          {safeString(video.title, 'Untitled')}
        </h3>

        <div className="video-card__meta">
          <span className="video-card__year">{formatYear(video.production_year)}</span>
          <span className="video-card__type">{video.type === 'series' ? 'TV Series' : 'Movie'}</span>
          <span className="video-card__genre">{safeString(video.genre, 'Unknown Genre')}</span>
        </div>

        {video.director && (
          <div className="video-card__director">Dir: {safeString(video.director, 'Unknown Director')}</div>
        )}

        {video.views && video.views > 0 && <div className="video-card__views">{formatViews(video.views)}</div>}
      </div>
    </div>
  );
};

export default VideoCard;
