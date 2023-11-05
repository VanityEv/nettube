import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Favorite from '@mui/icons-material/Favorite';
import IconButton from '@mui/material/IconButton';
import TransitionsModal from './TransitionsModal';
import { useMediaQuery, useTheme } from '@mui/material';
import { Video } from '../store/videos.types';
import { FavoriteBorder } from '@mui/icons-material';
import { useState } from 'react';
import useHttp from '../hooks/useHttp';

type MediaCardProps = {
  liked?: boolean;
  video: Video;
};

export default function MediaCard({ liked, video }: MediaCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  const [clickedLike, setClickedLike] = useState(false);
  const { sendRequest } = useHttp();
  const sendDeleteLikeQuery = async (show_title: string) => {
    const username = localStorage.getItem('username');
    const response = await sendRequest({
      method: 'POST',
      body: {
        username: username,
        show_title: show_title,
      },
      endpoint: `/user/deleteLike`,
    });
    if (response.result === 'SUCCESS') {
      setClickedLike(false);
    }
  };

  const sendAddLikeQuery = async (show_title: string) => {
    const username = localStorage.getItem('username');
    const response = await sendRequest({
      method: 'POST',
      body: {
        username: username,
        show_title: show_title,
      },
      endpoint: `/user/addLike`,
    });
    if (response.result === 'SUCCESS') {
      setClickedLike(true);
    }
  };

  const handleFavoriteDelete = (title: string) => {
    sendDeleteLikeQuery(title);
  };
  const handleFavoriteAdd = (title: string) => {
    sendAddLikeQuery(title);
  };
  return (
    <Card
      sx={{
        maxWidth: 345,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <CardMedia component="img" image={video.thumbnail} alt={video.alt} sx={{ objectFit: 'contain' }} />
      <CardContent>
        <Typography gutterBottom variant="h5" textAlign="center" color='contrast'>
          {video.title}
        </Typography>
        {!isMobile && (
          <Typography variant="body2">
            {video.descr.length > 100 ? video.descr.slice(0, 97) + '...' : video.descr}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        {liked || clickedLike ? (
          <IconButton
            aria-label="delete from favorites"
            onClick={() => {
              handleFavoriteDelete(video.title);
            }}
          >
            <Favorite color="error" />
          </IconButton>
        ) : (
          <IconButton
            aria-label="add to favorites"
            onClick={() => {
              handleFavoriteAdd(video.title);
            }}
          >
            <FavoriteBorder color="error" />
          </IconButton>
        )}
        <IconButton aria-label="play">
          <TransitionsModal {...video} />
        </IconButton>
      </CardActions>
    </Card>
  );
}
