import {
  Box,
  Stack,
  SxProps,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { api } from '../../constants';
import { SnackbarContext } from '../../App';
import { useContext, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { reset, fetchVideos } from '../../store/slices/videosSlice';
import { getCookie } from 'typescript-cookie';

export const UploadVideoForm = () => {
  const { showSnackbar } = useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const fieldSx: SxProps = {
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
    type: z.enum(['film', 'series']),
    productionYear: z.string(),
    productionCountry: z.string().min(3),
    director: z.string().min(1),
    genre: z.string().min(1),
    tags: z.string().min(1),
    description: z.string().min(1),
    alternativeTitle: z.string().min(1),
    video: z.any(),
    thumbnail: z.any(),
    cinematicThumbnail: z.any().optional(),
  });

  type Schema = z.infer<typeof AddVideoFormSchema>;

  const form = useForm<Schema>({
    resolver: zodResolver(AddVideoFormSchema),
    defaultValues: {
      title: '',
      type: 'film',
      productionYear: '',
      productionCountry: '',
      director: '',
      genre: '',
      tags: '',
      description: '',
      alternativeTitle: '',
      video: '',
      thumbnail: '',
      cinematicThumbnail: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Schema) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('type', data.type);
      formData.append('productionYear', data.productionYear.toString());
      formData.append('productionCountry', data.productionCountry);
      formData.append('genre', data.genre);
      formData.append('director', data.director);
      formData.append('tags', data.tags);
      formData.append('description', data.description);
      formData.append('alternativeTitle', data.alternativeTitle);
      formData.append('video', data.video[0]);
      formData.append('thumbnail', data.thumbnail[0]);
      if (data.cinematicThumbnail && data.cinematicThumbnail[0]) {
        formData.append('cinematicThumbnail', data.cinematicThumbnail[0]);
      }
      setIsLoading(true);
      const response = await axios.post(`${api}/videos/upload/movie`, formData, {
        headers: { Authorization: `Bearer ${getCookie('userToken')}` },
      });

      if (response.status === 200) {
        showSnackbar('Movie uploaded successfully', 'success');
        setIsLoading(false);
        dispatch(reset());
        dispatch(fetchVideos());
      } else {
        showSnackbar('Error uploading file', 'error');
        setIsLoading(false);
      }
    } catch (error) {
      // --- API ERROR HANDLING: Always show user-friendly error messages, never stack traces ---
      // Example:
      // try { ... } catch (error) { showSnackbar('Something went wrong. Please try again.', 'error'); }
      //
      // Never display raw error or stack trace to the user in production.
      showSnackbar(`${error}`, 'error');
      setIsLoading(false);
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
          name="type"
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              aria-label="type"
              name="type"
              value={field.value}
              onChange={e => form.setValue('type', e.target.value as Schema['type'])}
              row
            >
              <FormControlLabel value="film" control={<Radio />} label="Movie" sx={{ color: 'white' }} />
              <FormControlLabel value="series" control={<Radio />} label="Series" sx={{ color: 'white' }} />
            </RadioGroup>
          )}
        />

        <Controller
          name="productionYear"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="production-year-field"
              required
              error={Boolean(form.formState.errors.productionYear)}
              label="Production Year"
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />

        <Controller
          name="productionCountry"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="production-country-field"
              required
              error={Boolean(form.formState.errors.productionCountry)}
              label="Production Country"
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />

        <Controller
          name="genre"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="genre-field"
              required
              error={Boolean(form.formState.errors.genre)}
              label="Genre/Genres"
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />

        <Controller
          name="director"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="director-field"
              required
              error={Boolean(form.formState.errors.director)}
              label="Director"
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />

        <Controller
          name="tags"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="tags-field"
              required
              error={Boolean(form.formState.errors.tags)}
              label="Tags"
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
              error={Boolean(form.formState.errors.description)}
              label="Description"
              multiline
              rows={3}
              sx={fieldSx}
              inputRef={ref}
              {...field}
            />
          )}
        />

        <Controller
          name="alternativeTitle"
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              aria-label="alternative-title-field"
              required
              error={Boolean(form.formState.errors.alternativeTitle)}
              label="Alternative Title"
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
            <>
              <InputLabel htmlFor="video-upload">Video Upload</InputLabel>
              <input
                type="file"
                accept="video/mp4"
                onChange={e => onChange(e.target.files)}
                onBlur={onBlur}
                ref={ref}
              />
            </>
          )}
        />
        <Controller
          name="thumbnail"
          control={form.control}
          render={({ field: { ref, onChange, onBlur } }) => (
            <>
              <InputLabel htmlFor="thumbnail-upload">Poster Thumbnail Upload (2:3 aspect ratio)</InputLabel>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={e => onChange(e.target.files)}
                onBlur={onBlur}
                ref={ref}
              />
            </>
          )}
        />
        <Controller
          name="cinematicThumbnail"
          control={form.control}
          render={({ field: { ref, onChange, onBlur } }) => (
            <>
              <InputLabel htmlFor="cinematic-thumbnail-upload">
                Cinematic Thumbnail Upload (16:9 aspect ratio) - Optional
              </InputLabel>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={e => onChange(e.target.files)}
                onBlur={onBlur}
                ref={ref}
              />
            </>
          )}
        />
        <Button type="submit" disabled={isLoading} sx={{ backgroundColor: 'primary.600', width: '8rem' }}>
          {isLoading ? <CircularProgress size="2rem" /> : 'Submit'}
        </Button>
      </Stack>
    </Box>
  );
};

// --- TESTING: All forms and critical flows should have e2e (Cypress/Playwright) and unit tests (Jest/RTL) ---
// Example:
// describe('UploadVideoForm', () => { it('uploads video securely', ...); });
//
// This ensures production reliability and security.
