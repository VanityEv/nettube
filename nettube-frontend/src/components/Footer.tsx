import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

export default function Footer() {
  return (
    <Box px={{ mobile: 3, desktop: 8 }} py={{ mobile: 5, desktop: 8 }}>
      <Container>
        <Grid container spacing={2}>
          <Grid item mobile={12} desktop={6}>
            <Box borderBottom={1} sx={{ textAlign: 'center' }}>
              NetTube
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/movies" color="inherit">
                Movies
              </Link>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/series" color="inherit">
                Series
              </Link>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/genres" color="inherit">
                Genres
              </Link>
            </Box>
          </Grid>
          <Grid item mobile={12} desktop={6}>
            <Box borderBottom={1} sx={{ textAlign: 'center' }}>
              My Profile
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/profile" color="inherit" sx={{ textAlign: 'center' }}>
                Profile
              </Link>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/logout" color="inherit" sx={{ textAlign: 'center' }}>
                Sign out
              </Link>
            </Box>
          </Grid>
        </Grid>
        <Box textAlign="center" pt={{ mobile: 5, desktop: 0 }} pb={{ mobile: 5, desktop: 0 }}>
          NetTube&reg; {new Date().getFullYear()}
        </Box>
      </Container>
    </Box>
  );
}
