import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Video } from '../../store/videos.types';
import useHttp from '../../hooks/useHttp';
import { useCallback, useState } from 'react';

export const AddVideoForm = ({ handleOpenChange }: { handleOpenChange: () => void }) => {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { mobile: '90%', desktop: '70%' },
    height: { mobile: '100%', desktop: '70%' },
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: { mobile: 2, desktop: 12 },
    objectFit: 'contain',
    overflowY: 'scroll',
  };

  const [selectedType, setSelectedType] = useState<'film' | 'series'>('film');

  const { sendRequest } = useHttp();
  const sendNewVideoQuery = useCallback(async (video: Video) => {
    const response = await sendRequest({
      method: 'POST',
      body: {
        title: video.title,
        type: video.type,
        genre: video.genre,
        production_year: video.production_year,
        production_country: video.production_country,
        director: video.director,
        age_restriction: video.age_restriction,
        tags: video.tags,
        descr: video.descr,
        thumbnail: video.thumbnail,
        alt: video.alt,
        tier: video.tier,
        link: video.link,
      },
      endpoint: `/videos/addVideo`,
    });
    if (response.result === 'success') {
      //TODO: Handle
      handleOpenChange();
    }
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newVideo: Video = {
      id: -1,
      title: data.get('title') as string,
      type: selectedType,
      genre: data.get('genres') as string,
      production_year: parseInt(data.get('production_year') as string),
      production_country: data.get('production_country') as string,
      age_restriction: parseInt(data.get('age_restriction') as string),
      tags: data.get('tags') as string,
      director: data.get('director') as string,
      descr: data.get('descr') as string,
      thumbnail: data.get('thumbnail') as string,
      grade: 0,
      alt: data.get('alt') as string,
      tier: data.get('subscription_tier') as string,
      reviews_count: 0,
      link: data.get('link') as string,
      blocked_reviews: 0,
    };
    sendNewVideoQuery(newVideo);
  };
  return (
    <Box component="form" onSubmit={handleSubmit} sx={style}>
      <Typography variant="h5">Add New Video</Typography>
      <Stack spacing={2}>
        <TextField
          required
          id="title"
          label="title"
          name="title"
          defaultValue=""
          placeholder="Title"
          variant="standard"
        />
        <TextField
          required
          id="genres"
          name="genres"
          label="genres"
          defaultValue=""
          placeholder="Genres"
          variant="standard"
        />
        <TextField
          required
          id="production_year"
          name="production_year"
          label="production_year"
          defaultValue="1900"
          placeholder="Production Year"
          variant="standard"
        />
        <TextField
          required
          id="production_country"
          name="production_country"
          label="production_country"
          defaultValue=""
          placeholder="Production Country"
          variant="standard"
        />
        <TextField
          required
          id="director"
          name="director"
          label="director"
          defaultValue=""
          placeholder="Director"
          variant="standard"
        />
        <TextField
          required
          id="age_restriction"
          name="age_restriction"
          label="age_restriction"
          defaultValue="0"
          placeholder="Age Restrictions"
          variant="standard"
        />
        <TextField required id="tags" name="tags" label="tags" defaultValue="" placeholder="Tags" variant="standard" />
        <TextField
          required
          id="descr"
          name="descr"
          label="descr"
          defaultValue=""
          placeholder="Description"
          variant="standard"
        />
        <TextField
          required
          id="thumbnail"
          name="thumbnail"
          label="thumbnail"
          defaultValue=""
          placeholder="Thumbnail URL"
          variant="standard"
        />
        <TextField
          required
          id="alt"
          name="alt"
          label="alt"
          defaultValue=""
          placeholder="Alternate text"
          variant="standard"
        />
        <TextField
          required
          id="subscription_tier"
          name="subscription_tier"
          label="subscription_tier"
          defaultValue=""
          placeholder="Subscription Tier"
          variant="standard"
        />
        <TextField
          required
          id="link"
          name="link"
          label="link"
          defaultValue=""
          placeholder="Video link"
          variant="standard"
        />
      </Stack>
      <Button type="submit" size="large" variant="contained" sx={{ mt: 3, mb: 2 }}>
        Confirm
      </Button>
    </Box>
  );
};
