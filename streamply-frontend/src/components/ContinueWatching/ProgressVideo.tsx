import { useState } from 'react';
import { ProgressedVideo } from '../../types/videos.types';
import { Box, IconButton, LinearProgress, Typography, Zoom } from '@mui/material';
import { api } from '../../constants';
import { NotInterested, PlayArrow } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { toKebabCase } from '../../helpers/convertToKebabCase';

export const ProgressVideo = ({
  watched,
  video,
  deleteHandler,
}: {
  watched: number;
  video: ProgressedVideo;
  deleteHandler: (id: number) => void;
}) => {
  const watchedPercent = watched / 60 / video.video_length;
  const [isHovered, setIsHovered] = useState(false);
  const url = video.thumbnail.includes('http') ? video.thumbnail : `${api}/images/thumbnails${video.thumbnail}`;

  const destinationRoute =
    video.type === 'film'
      ? `/movie/${toKebabCase(video.title)}`
      : `/series/${toKebabCase(video.title)}/season/${video.season}/episode/${video.episode}`;

  const queryParams = new URLSearchParams();
  queryParams.append('timestamp', watched.toString());
  queryParams.append('id', video.id.toString())

  const routeWithParams = `${destinationRoute}?${queryParams.toString()}`;

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        height: '40vh',
        aspectRatio: '3 / 2',
        width: { desktop: 'auto', mobile: '100vw' },
        maxWidth: '100vw',
        background: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
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
            <Box sx={{ width: '100%', height: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  mr: 4,
                  mb: '1.5rem',
                }}
              >
                <Link
                  to={routeWithParams}
                  style={{
                    width: '100%',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '1rem', color: 'white', mr: '2rem' }}>Play Video</Typography>
                  <PlayArrow sx={{ color: 'white', fontSize: '2.5rem' }} />
                </Link>
                <IconButton sx={{ width: '100%' }} onClick={() => deleteHandler(video.id)}>
                  <Typography sx={{ fontSize: '1rem', color: 'white', mr: '1rem' }}>Not Interested</Typography>
                  <NotInterested sx={{ color: 'white', fontSize: '2rem' }} />
                </IconButton>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  ml: '2rem',
                  mb: '2rem',
                }}
              >
                <Typography
                  variant="body1"
                  color="white"
                  sx={{
                    fontSize: '1rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {`${video.title}`}
                </Typography>
              </Box>
            </Box>
          </Zoom>
        )}
      </Box>
      <LinearProgress
        sx={{ position: 'absolute', bottom: 0, width: '100%', height: '0.5rem' }}
        variant="determinate"
        color="error"
        value={watchedPercent * 100}
      />
    </Box>
  );
};
