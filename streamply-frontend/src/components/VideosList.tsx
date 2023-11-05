import Grid2 from '@mui/material/Unstable_Grid2';
import MediaCard from './MediaCard';
import { useAppSelector } from '../hooks/useRedux';
import useHttp from '../hooks/useHttp';
import React, { useEffect, useState } from 'react';
import { LikeEntry } from './UserProfileAccordion';
import { Video } from '../store/videos.types';
import { Box, Button, Divider } from '@mui/material';

type VideosListProps = {
  type: 'movies' | 'series' | 'genres' | 'all';
};

const VideosList = (props: VideosListProps) => {
  const { type } = props;
  const videos = useAppSelector(state => state.videos.videos);
  const searchValue = useAppSelector(state => state.ui.searchValue);
  const [selectedGenres, setSelectedGenres] = useState<String[]>([]);

  const { sendRequest } = useHttp();

  const [likesData, setLikesData] = useState<LikeEntry[] | []>([]);

  const mapLikes = new Map<number, boolean>();
  likesData.forEach(like => mapLikes.set(like.id, true));

  let selectedVideos: Video[] = [];
  if (type === 'movies') selectedVideos = videos.filter(video => video.type === 'film');
  if (type === 'series') selectedVideos = videos.filter(video => video.type === 'series');
  if (type === 'genres') selectedVideos = videos;
  if (type === 'all') selectedVideos = videos;

  let searchedVideos = searchValue
    ? selectedVideos.filter(
        video =>
          video.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          video.tags.split(' ').includes(searchValue.toLowerCase())
      )
    : selectedVideos;

  if (type === 'genres' && selectedGenres.length > 0)
    searchedVideos = searchedVideos.filter(video => selectedGenres.includes(video.genre));

  const genres = Array.from(new Set(videos.map(video => video.genre)));

  const handleGenreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const selected = event.currentTarget.name;
    if (selectedGenres.includes(selected)) {
      setSelectedGenres(prevState => prevState.filter(genre => genre !== selected));
    } else {
      setSelectedGenres(prevState => [...prevState, selected]);
    }
  };

  useEffect(() => {
    const likeList = async () => {
      const username = localStorage.getItem('username');
      const response = await sendRequest({
        method: 'GET',
        endpoint: `/user/userLikes/${username}`,
      });

      if (response.result === 'SUCCESS') {
        setLikesData(response.data);
      }
    };
    likeList();
  }, [sendRequest]);

  return (
    <>
      <Box sx={{ backgroundColor: 'secondary.300' }}>
        {type === 'genres' && (
          <>
            <Box marginBottom={2} width="100%" display="flex" flexDirection="row" flexWrap="wrap">
              {genres.map(genre => (
                <Button
                  onClick={handleGenreClick}
                  sx={{ margin: '24px 24px 0 24px' }}
                  variant={selectedGenres.includes(genre) ? 'contained' : 'outlined'}
                  name={genre}
                >
                  {genre}
                </Button>
              ))}
            </Box>
            <Divider />
          </>
        )}
        <Grid2 container spacing={2} sx={{ pt: 2, maxWidth: '100%' }}>
          {searchedVideos.map((item, key) => (
            <Grid2
              key={key}
              mobile={12}
              desktop={3}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'secondary.300',
              }}
            >
              <MediaCard liked={mapLikes.get(item.id)} video={item} />
            </Grid2>
          ))}
        </Grid2>
      </Box>
    </>
  );
};

export default VideosList;
