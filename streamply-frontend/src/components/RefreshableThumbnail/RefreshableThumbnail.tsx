// RefreshableThumbnail component that automatically handles expired B2 URLs
// Used in admin panels to ensure thumbnails always load

import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useRefreshableThumbnail } from '../../hooks/useRefreshableThumbnail';

interface RefreshableThumbnailProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}

export const RefreshableThumbnail: React.FC<RefreshableThumbnailProps> = ({ src, alt, style, className }) => {
  const { thumbnailUrl, isLoading, error } = useRefreshableThumbnail(src);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: style?.width || 'auto',
          height: style?.height || 'auto',
          minHeight: '50px',
        }}
      >
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: style?.width || 'auto',
          height: style?.height || 'auto',
          minHeight: '50px',
          backgroundColor: '#f0f0f0',
          color: '#666',
        }}
      >
        Failed to load
      </Box>
    );
  }

  return <img src={thumbnailUrl} alt={alt} style={style} className={className} />;
};
