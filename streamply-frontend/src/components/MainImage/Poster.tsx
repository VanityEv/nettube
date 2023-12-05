import { Box, ButtonBase, Divider, Stack, Typography, Zoom } from '@mui/material';

type PosterProps = {
  movie: string;
  title: string;
  variant: 'overlay' | 'caption';
  active: boolean;
  setActive: (title: string) => void;
};

export const Poster = ({ movie, title, variant, active, setActive }: PosterProps) => {
  return (
    <ButtonBase
      sx={{ height: '100%' }}
      onClick={() => {
        sessionStorage.setItem('selectedMovie', title);
        sessionStorage.setItem('selectedMovieBackground', movie);
        setActive(title);
      }}
    >
      {variant === 'caption' ? (
        <Stack sx={{ alignItems: 'center' }}>
          <img
            src={movie}
            style={{
              aspectRatio: '2 / 3',
              width: '90%',
              height: 'auto',
            }}
          />
          <Typography
            variant="body1"
            color="white"
            sx={{ fontSize: '20px', fontWeight: '700', my: '.5rem', letterSpacing: '.1rem' }}
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
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(0, 0, 0, 0.99)), url(${movie})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            height: '400px',
            aspectRatio: '2 / 3',
            width: 'auto',
            display: 'flex',
            alignItems: 'end',
          }}
        >
          <Typography
            variant="body1"
            color="white"
            sx={{
              ml: '2rem',
              mb: '2rem',
              fontSize: '20px',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Typography>
        </Box>
      )}
    </ButtonBase>
  );
};
