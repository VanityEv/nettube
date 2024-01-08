import { Box, Typography, Zoom } from '@mui/material';
import { Video } from '../../types/videos.types';
import { getRatingColor } from '../../helpers/getRatingColors';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toKebabCase } from '../../helpers/convertToKebabCase';
import { api } from '../../constants';

export const HorizontalVideo = ({ video, height }: { video: Video; height?: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const url = video.thumbnail.includes('http') ? video.thumbnail : `${api}/images/thumbnails${video.thumbnail}`;

  const destinationRoute =
    video.type === 'film' ? `/movies/${toKebabCase(video.title)}` : `/series/${toKebabCase(video.title)}`;

  return (
    <Link style={{ textDecoration: 'none' }} to={destinationRoute}>
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: 'relative',
          height: height ?? '40vh',
          aspectRatio: '3 / 2',
          width: 'auto',
          maxWidth: '100vw',
          background: `url(${url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'transform 0.6s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
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
