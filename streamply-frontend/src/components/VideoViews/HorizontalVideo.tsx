import { Box, Typography, Zoom } from '@mui/material';
import { Video } from '../../types/videos.types';
import { getRatingColor } from '../../helpers/getRatingColors';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toKebabCase } from '../../helpers/convertToKebabCase';
import { api } from '../../constants';
import { RefreshableThumbnail } from '../RefreshableThumbnail/RefreshableThumbnail';

export const HorizontalVideo = ({ video, height }: { video: Video; height?: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Use cinematic thumbnail for horizontal display if available, fallback to regular thumbnail
  const thumbnailToUse = video.cinematic_thumbnail || video.thumbnail;
  const url = thumbnailToUse.includes('http') ? thumbnailToUse : `${api}/images/thumbnails${thumbnailToUse}`;
  const isB2Url = url.includes('backblazeb2.com');

  // Link to the video detail page instead of directly to player
  const destinationRoute = `/video/${toKebabCase(video.title)}`;

  const queryParams = new URLSearchParams();
  queryParams.append('id', video.id.toString());
  const routeWithParams = `${destinationRoute}?${queryParams.toString()}`;

  return (
    <Link style={{ textDecoration: 'none' }} to={routeWithParams}>
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: 'relative',
          height: height ?? '40vh',
          aspectRatio: '16 / 9', // Changed from 3:2 to 16:9 (more common video ratio)
          width: { desktop: 'auto', mobile: '100vw' },
          maxWidth: '100vw',
          overflow: 'hidden',
          transition: 'transform 0.6s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        {/* Use RefreshableThumbnail for B2 URLs, regular background for others */}
        {isB2Url ? (
          <RefreshableThumbnail
            src={url}
            alt={video.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', // This maintains aspect ratio but may show black bars
              objectPosition: 'center center',
              backgroundColor: '#000', // Black background for any empty space
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `url(${url})`,
              backgroundSize: 'contain', // Equivalent to objectFit: contain
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#000', // Black background for any empty space
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            ...(isHovered && {
              backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(0, 0, 0, 0.99))`,
            }),
            display: 'flex',
            alignItems: 'flex-end',
            transition: 'background-image 0.6s ease-in-out',
          }}
        >
          {isHovered && (
            <Zoom in={isHovered} timeout={{ enter: 600, exit: 600 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', ml: '2rem', mb: '1rem' }}>
                <Typography
                  variant="body1"
                  color="white"
                  sx={{
                    fontSize: '14px',
                    textTransform: 'capitalize',
                  }}
                >
                  {`${video.title}`}
                </Typography>
                <Typography
                  variant="body1"
                  color={getRatingColor(video.grade)}
                  sx={{
                    fontSize: '12px',
                    textTransform: 'capitalize',
                  }}
                >
                  Rating: {video.grade}
                </Typography>
              </Box>
            </Zoom>
          )}
        </Box>
      </Box>
    </Link>
  );
};
