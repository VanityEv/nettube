import { Box } from '@mui/material';
import { useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import VideoJS from '../components/VideoJS';
import { useParams } from 'react-router-dom';

export const MoviePlayer = () => {
  const { title } = useParams();
  const options = {
    controls: true,
    fill: true,
    responsive: true,
    sources: [
      {
        src: `http://localhost:3001/movies/${title}/${title}.m3u8`,
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
        height: '50vmin',
        width: '60vmax',
        boxSizing: 'border-box',
      }}
    >
      <VideoJS options={options} onReady={handlePlayerReady} />;
    </Box>
  );
};
