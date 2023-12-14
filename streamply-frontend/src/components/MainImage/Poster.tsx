import { Box, ButtonBase, Divider, Stack, Typography, Zoom } from '@mui/material';

type PosterProps = {
  posterURL: string;
  title: string;
  variant: 'overlay' | 'caption';
  active: boolean;
  setActive: (title: string) => void;
};

export const Poster = ({ posterURL, title, variant, active, setActive }: PosterProps) => {
  return (
    <ButtonBase
      sx={{ height: '100%' }}
      onClick={() => {
        sessionStorage.setItem('selectedMovie', title);
        sessionStorage.setItem('selectedMovieBackground', posterURL);
        setActive(title);
      }}
    >
      {variant === 'caption' ? (
        <Stack sx={{ alignItems: 'center' }}>
          <img
            src={posterURL}
            style={{
              aspectRatio: '2 / 3',
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
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(0, 0, 0, 0.99)), url(${posterURL})`,
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
    </ButtonBase>
  );
};
