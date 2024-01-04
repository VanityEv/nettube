import {
  Box,
  Stack,
  SxProps,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  Autocomplete,
  Select,
  MenuItem,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useVideosStore } from '../../state/videosStore';
import { Video } from '../../store/videos.types';
import axios from 'axios';
import { useContext } from 'react';
import { SnackbarContext } from '../../App';
import { SERVER_ADDR, SERVER_PORT } from '../../constants';

export const UploadEpisodeForm = () => {
  const { videos } = useVideosStore();
  const { showSnackbar } = useContext(SnackbarContext);
  const availableSeries = videos.filter(video => video.type === 'series');

  //styles for each field
  const fieldSx: SxProps = {
    multilineColor: { color: 'white' },
    input: { color: 'white' },
    width: {
      mobile: '75%',
      desktop: '30%',
    },
    '& .MuiOutlinedInput-root:hover': {
      '& > fieldset': {
        borderColor: 'white',
      },
    },
  };

  const AddVideoFormSchema = z.object({
    title: z.string().min(1, {
      message: 'Please enter a valid title.',
    }),
    description: z.string().min(1),
    show: z.number(),
    season: z.string(),
    episode: z.string(),
    video: z.any(),
  });

  type Schema = z.infer<typeof AddVideoFormSchema>;

  const form = useForm<Schema>({
    resolver: zodResolver(AddVideoFormSchema),
    defaultValues: {
      title: '',
      description: '',
      show: availableSeries[0].id,
      video: '',
      season: '',
      episode: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Schema) => {
    try {
      const selectedSeries = availableSeries.find(series => series.id === data.show);
      const show_title = selectedSeries ? selectedSeries.title : 'test';
      // Create a FormData object to send the form data, including the file
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('show_title', show_title);
      formData.append('season', data.season);
      formData.append('episode', data.episode);
      formData.append('show', String(data.show));
      formData.append('episode_file', data.video[0]);

      // Send the form data to the backend
      const response = await axios.post(`${SERVER_ADDR}:${SERVER_PORT}/videos/upload/episode`, formData);

      // Handle the response
      if (response.status === 200) {
        showSnackbar('Episode uploaded successfully', 'success');
        // Optionally reset the form after successful submission
        form.reset();
      } else {
        showSnackbar('Episode upload error', 'error');
        console.error('Form submission failed:', response.statusText);
        // Handle the error or show an error message to the user
      }
    } catch (error) {
      console.error('Error submitting the form:', error);
      // Handle unexpected errors
    }
  };

  return (
    <Box component="form" noValidate onSubmit={form.handleSubmit(onSubmit)} sx={{ mt: 3, pb: 2, width: '100%' }}>
      <Stack
        spacing={3}
        sx={{
          input: { color: 'white' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          '&>div>div>fieldset': { borderColor: 'primary.600' },
        }}
      >
        <Controller
          name="title"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="title-field"
              required
              error={Boolean(form.formState.errors.title)}
              label="Title"
              autoFocus
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="description-field"
              required
              multiline
              rows={3}
              error={Boolean(form.formState.errors.description)}
              label="Description"
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />
        <Controller
          name="show"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <Select
              labelId="show-select"
              label="Select Show"
              required
              error={Boolean(form.formState.errors.show)}
              inputRef={ref}
              variant="outlined"
              sx={{
                color: 'white',
                width: {
                  mobile: '75%',
                  desktop: '30%',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e51445',
                },
                '& .MuiOutlinedInput-notchedOutline:hover': {
                  border: '1px solid white',
                },
              }}
              {...field}
            >
              {availableSeries.map(option => (
                <MenuItem sx={{ color: 'white' }} key={option.id} value={option.id}>
                  {option.title}
                </MenuItem>
              ))}
            </Select>
          )}
        />
        <Controller
          name="season"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="season-field"
              required
              error={Boolean(form.formState.errors.season)}
              helperText={form.formState.errors.season ? 'Error here' : ''}
              label="Season"
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />
        <Controller
          name="episode"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="episode-field"
              required
              error={Boolean(form.formState.errors.episode)}
              helperText={form.formState.errors.episode ? 'Error here' : ''}
              label="Episode"
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />

        <Controller
          name="video"
          control={form.control}
          render={({ field: { ref, onChange, onBlur } }) => (
            <input type="file" accept="video/mp4" onChange={e => onChange(e.target.files)} onBlur={onBlur} ref={ref} />
          )}
        />

        <Button type="submit" sx={{ backgroundColor: 'primary.600', width: '8rem' }}>
          Submit
        </Button>
      </Stack>
    </Box>
  );
};
