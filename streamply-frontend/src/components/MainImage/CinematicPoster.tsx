import { Box, Divider, Stack, Typography, Zoom } from '@mui/material';
import { api } from '../../constants';
import { useRefreshableThumbnail } from '../../hooks/useRefreshableThumbnail';

type CinematicPosterProps = {
  posterURL?: string;
  cinematicURL?: string;
  title: string;
  variant: 'overlay' | 'caption';
  active?: boolean;
};

export const CinematicPoster = ({ posterURL, cinematicURL, title, variant, active }: CinematicPosterProps) => {
  // Prefer cinematic thumbnail, fallback to regular poster
  const preferredURL = cinematicURL || posterURL || '';
  const initialUrl = preferredURL.includes('http') ? preferredURL : `${api}/images/thumbnails${preferredURL}`;
  const { thumbnailUrl } = useRefreshableThumbnail(initialUrl);

  // Use the refreshable URL if available, otherwise fall back to the initial URL
  const url = thumbnailUrl || initialUrl;

  return (
    <>
      {variant === 'caption' ? (
        <Stack sx={{ alignItems: 'center' }}>
          <img
            alt={`cinematic-poster-${title}`}
            src={url}
            style={{
              aspectRatio: '16 / 9',
              width: '90%',
              height: 'auto',
            }}
          />
          <Typography
            variant="body1"
            color="white"
            sx={{ fontSize: '16px', fontWeight: '700', my: '.5rem', letterSpacing: '.1rem' }}
          >
            {title}
          </Typography>
          <Zoom in={active}>
            <Divider
              sx={{
                width: '80%',
                height: '5px',
                backgroundColor: 'primary.600',
                borderRadius: '100px',
              }}
            />
          </Zoom>
        </Stack>
      ) : (
        <Box
          sx={{
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(0, 0, 0, 0.99)), url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            height: '200px',
            aspectRatio: '16 / 9',
            width: 'auto',
            display: 'flex',
            alignItems: 'end',
          }}
        >
          <Typography
            variant="body1"
            color="white"
            sx={{
              ml: '1rem',
              mb: '1rem',
              fontSize: '20px',
              textTransform: 'capitalize',
              textAlign: 'start',
            }}
          >
            {title}
          </Typography>
        </Box>
      )}
    </>
  );
};
