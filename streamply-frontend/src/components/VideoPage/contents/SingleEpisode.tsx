import { Box, Typography, Zoom } from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Episode } from '../../../types/videos.types';
import { toKebabCase } from '../../../helpers/convertToKebabCase';

export const SingleEpisode = ({ episode }: { episode: Episode }) => {
  const [isHovered, setIsHovered] = useState(false);

  const destinationRoute = `/series/${toKebabCase(episode.show_name)}/season/${episode.season}/episode/${episode.episode}`;
  const queryParams = new URLSearchParams();
  queryParams.append('id', episode.show_id.toString())

  const routeWithParams = `${destinationRoute}?${queryParams.toString()}`;

  return (
    <Link
      style={{ textDecoration: 'none' }}
      to={routeWithParams}
    >
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: 'relative',
          height: '20vh',
          aspectRatio: '3 / 2',
          width: 'auto',
          maxWidth: '100vw',
          background: `url(${episode.thumbnail})`,
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
                  {`${episode.episode_name}`}
                </Typography>
              </Box>
            </Zoom>
          )}
        </Box>
      </Box>
    </Link>
  );
};
