import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

export default function Footer() {
  return (
    <footer>
      <Box
        px={{ mobile: 3, desktop: 10 }}
        py={{ mobile: 5, desktop: 10 }}
        bgcolor="primary.main"
        color="white"
      >
        <Container>
          <Grid container spacing={5}>
            <Grid item mobile={12} desktop={4}>
              <Box borderBottom={1}>Module1</Box>
              <Box>
                <Link href="/" color="inherit">
                  link1
                </Link>
              </Box>
              <Box>
                <Link href="/" color="inherit">
                  link2
                </Link>
              </Box>
              <Box>
                <Link href="/" color="inherit">
                  link3
                </Link>
              </Box>
            </Grid>
            <Grid item mobile={12} desktop={4}>
              <Box borderBottom={1}>Module2</Box>
              <Box>
                <Link href="/" color="inherit">
                  link1
                </Link>
              </Box>
              <Box>
                <Link href="/" color="inherit">
                  link2
                </Link>
              </Box>
            </Grid>
            <Grid item mobile={12} desktop={4}>
              <Box borderBottom={1}>Module3</Box>
              <Box>
                <Link href="/" color="inherit">
                  link1
                </Link>
              </Box>
              <Box>
                <Link href="/" color="inherit">
                  link2
                </Link>
              </Box>
              <Box>
                <Link href="/" color="inherit">
                  link3
                </Link>
              </Box>
            </Grid>
          </Grid>
          <Box textAlign="center" pt={{ mobile: 5, desktop: 0 }} pb={{ mobile: 5, desktop: 0 }}>
            NetTube &reg; {new Date().getFullYear()}
          </Box>
        </Container>
      </Box>
    </footer>
  );
}