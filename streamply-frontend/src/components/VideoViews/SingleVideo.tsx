import { Box, IconButton, Typography } from '@mui/material';
import { Video } from '../../store/videos.types';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { getRatingColor } from '../../helpers/getRatingColors';
import { useUserStore } from '../../state/userStore';
import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../../constants';
import { useState } from 'react';

type UpdateResponse = { result: string };

export const SingleVideo = ({ video }: { video: Video }) => {
  const { likes, username, setLikes } = useUserStore();
  const [liked, setLiked] = useState(likes.includes(video.id));

  const updateUserLike = async (id: number, mode: 'add' | 'delete') => {
    const endpointPath = mode === 'add' ? '/user/addLike' : '/user/deleteLike';
    const response = await axios.post<UpdateResponse>(SERVER_ADDR + ':' + SERVER_PORT + endpointPath, {
      username: username,
      show_id: id,
    });
    return response.data.result;
  };

  const handleLikeChange = async (id: number, mode: 'add' | 'delete') => {
    try {
      const result = await updateUserLike(id, mode);
      if (result === 'SUCCESS') {
        setLiked(prevLiked => !prevLiked);
        await setLikes(username);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(0, 0, 0, 0.99)), url(${video.thumbnail})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        height: '400px',
        aspectRatio: '2 / 3',
        width: 'auto',
        display: 'flex',
        alignItems: 'end',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'end',
          width: '100%',
        }}
      >
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
        {liked ? (
          <IconButton onClick={() => handleLikeChange(video.id, 'delete')}>
            <Favorite color="error" sx={{ mr: '2rem', mb: '1rem' }} />
          </IconButton>
        ) : (
          <IconButton onClick={() => handleLikeChange(video.id, 'add')}>
            <FavoriteBorder color="error" sx={{ mr: '2rem', mb: '1rem' }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};
