import { Box, IconButton, Typography } from '@mui/material';
import { Video } from '../../types/videos.types';
import { Bookmark, BookmarkBorder, PlayCircleOutline } from '@mui/icons-material';
import { getRatingColor } from '../../helpers/getRatingColors';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchUserLikes } from '../../store/slices/userSlice';
import { useRefreshableThumbnail } from '../../hooks/useRefreshableThumbnail';
import axios from 'axios';
import { api } from '../../constants';
import { useState } from 'react';
import { toKebabCase } from '../../helpers/convertToKebabCase';
import { getCookie } from 'typescript-cookie';
import { SubscriptionModal } from '../SubscriptionModal';
import { Link } from 'react-router-dom';

type UpdateResponse = { result: string };

export const SingleVideo = ({ video }: { video: Video }) => {
  const { likes, username } = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();
  const [liked, setLiked] = useState(likes.includes(video.id));
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  // Link to the video detail page
  const detailPageRoute = `/video/${toKebabCase(video.title)}`;

  // Keep the original player route for the play button
  const destinationRoute =
    video.type === 'film' ? `/movie/${toKebabCase(video.title)}` : `/series/${toKebabCase(video.title)}`;

  // Use refreshable thumbnail for B2 URLs
  const initialUrl = video.thumbnail.includes('http') ? video.thumbnail : `${api}/images/thumbnails${video.thumbnail}`;
  const { thumbnailUrl } = useRefreshableThumbnail(initialUrl);
  const url = thumbnailUrl || initialUrl;

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
        setLiked((prevLiked: boolean) => !prevLiked);
        // Update Redux state by refetching user likes
        await dispatch(fetchUserLikes(username));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Check subscription before navigation
  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleLikeClick = (e: React.MouseEvent, id: number, mode: 'add' | 'delete') => {
    e.preventDefault();
    e.stopPropagation();
    handleLikeChange(id, mode);
  };

  return (
    <>
      <Link style={{ textDecoration: 'none' }} to={detailPageRoute}>
        <Box
          sx={{
            position: 'relative',
            height: '40vh',
            aspectRatio: '2 / 3',
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
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.8) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mb: '1rem',
                mx: '0.5rem',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
                {liked ? (
                  <IconButton onClick={e => handleLikeClick(e, video.id, 'delete')}>
                    <Bookmark color="error" />
                  </IconButton>
                ) : (
                  <IconButton onClick={e => handleLikeClick(e, video.id, 'add')}>
                    <BookmarkBorder color="error" />
                  </IconButton>
                )}
                <IconButton onClick={handlePlayClick} sx={{ color: 'white' }}>
                  <PlayCircleOutline />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: '1rem' }}>
                <Typography
                  variant="body1"
                  color="white"
                  sx={{
                    fontSize: '14px',
                    textTransform: 'capitalize',
                    textAlign: 'right',
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
                    textAlign: 'right',
                  }}
                >
                  Rating: {video.grade}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Link>

      <SubscriptionModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        videoTitle={video.title}
      />
    </>
  );
};
