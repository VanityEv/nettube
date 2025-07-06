import { Box, IconButton, Typography } from '@mui/material';
import { Video } from '../../types/videos.types';
import { Bookmark, BookmarkBorder, PlayCircleOutline } from '@mui/icons-material';
import { getRatingColor } from '../../helpers/getRatingColors';
import { useUserStore } from '../../state/userStore';
import axios from 'axios';
import { api } from '../../constants';
import { useState } from 'react';
import { toKebabCase } from '../../helpers/convertToKebabCase';
import { getCookie } from 'typescript-cookie';
import { SubscriptionModal } from '../SubscriptionModal';

type UpdateResponse = { result: string };

export const SingleVideo = ({ video }: { video: Video }) => {
  const { likes, username, setLikes } = useUserStore();
  const [liked, setLiked] = useState(likes.includes(video.id));
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const destinationRoute =
    video.type === 'film' ? `/movies/${toKebabCase(video.title)}` : `/series/${toKebabCase(video.title)}`;
  const url = video.thumbnail.includes('http') ? video.thumbnail : `${api}/images/thumbnails${video.thumbnail}`;

  const queryParams = new URLSearchParams();
  queryParams.append('id', video.id.toString());
  const routeWithParams = `${destinationRoute}?${queryParams.toString()}`;

  const updateUserLike = async (id: number, mode: 'add' | 'delete') => {
    const endpointPath = mode === 'add' ? '/user/addLike' : '/user/deleteLike';
    const response = await axios.post<UpdateResponse>(
      api + endpointPath,
      {
        username: username,
        show_id: id,
      },
      { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
    );
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

  // Check subscription before navigation
  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      const response = await axios.get(`${api}/user/getSubscription/${username}`, {
        headers: { Authorization: `Bearer ${getCookie('userToken')}` },
      });

      if (response.data.status === 'active') {
        // Navigate to video player
        window.location.href = routeWithParams;
      } else {
        // Show subscription modal
        setSubscriptionModalOpen(true);
      }
    } catch (error) {
      setSubscriptionModalOpen(true);
    }
  };

  return (
    <>
      <Box
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
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', mb: '1rem', mr: '0.5rem' }}>
            {liked ? (
              <IconButton onClick={() => handleLikeChange(video.id, 'delete')}>
                <Bookmark color="error" />
              </IconButton>
            ) : (
              <IconButton onClick={() => handleLikeChange(video.id, 'add')}>
                <BookmarkBorder color="error" />
              </IconButton>
            )}
            <IconButton onClick={handlePlayClick} sx={{ color: 'white' }}>
              <PlayCircleOutline />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <SubscriptionModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        videoTitle={video.title}
      />
    </>
  );
};
