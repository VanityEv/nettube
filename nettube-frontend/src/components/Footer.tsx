import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

export default function Footer() {
  return (
    <footer>
      <Box
        px={{ xs: 3, sm: 10 }}
        py={{ xs: 5, sm: 10 }}
        bgcolor="primary.main"
        color="white"
      >
        <Container maxWidth="lg">
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
          <Box textAlign="center" pt={{ xs: 5, sm: 0 }} pb={{ xs: 5, sm: 0 }}>
            NetTube &reg; {new Date().getFullYear()}
          </Box>
        </Container>
      </Box>
    </footer>
  );
}