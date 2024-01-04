import { Box } from '@mui/material';
import { useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import VideoJS from '../components/VideoJS';

export const VideoPlayer = () => {
  const options = {
    controls: true,
    fill: true,
    responsive: true,
    sources: [
      {
        src: 'http://localhost:3001/movies/family-guy/season-1/family-guy-s1e1.m3u8',
        type: 'application/x-mpegURL',
      },
    ],
  };

  const playerRef = useRef<Player | null>(null);

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on('waiting', () => {
      videojs.log('player is waiting');
    });

    player.on('dispose', () => {
      videojs.log('player will dispose');
    });
  };

  return (
    <Box
      sx={{
        height: '1080px',
        width: '1920px',
        boxSizing: 'border-box',
      }}
    >
      <VideoJS options={options} onReady={handlePlayerReady} />;
    </Box>
  );
};
