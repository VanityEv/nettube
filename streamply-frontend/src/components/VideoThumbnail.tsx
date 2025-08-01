import React, { useState } from 'react';

interface VideoThumbnailProps {
  src?: string | null;
  alt: string;
  type?: 'film' | 'series';
  className?: string;
  style?: React.CSSProperties;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ src, alt, type = 'film', className = '', style = {} }) => {
  const [imageSrc, setImageSrc] = useState<string>(src || getDefaultThumbnail(type));
  const [hasError, setHasError] = useState<boolean>(false);

  function getDefaultThumbnail(videoType: 'film' | 'series'): string {
    const baseStyle = '300x445';
    const bgColor = videoType === 'series' ? '1a1a2e' : '16213e';
    const textColor = 'ffffff';
    const text = videoType === 'series' ? 'TV Series' : 'Movie';

    return `https://via.placeholder.com/${baseStyle}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
  }

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(getDefaultThumbnail(type));
    }
  };

  const handleImageLoad = () => {
    setHasError(false);
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`video-thumbnail ${className}`}
      style={style}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading="lazy"
    />
  );
};

export default VideoThumbnail;
