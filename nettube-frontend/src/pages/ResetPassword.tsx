import * as React from 'react';
import { Box, Typography, Container, TextField, Button } from '@mui/material';
import { Stack } from '@mui/material';

/**
 * TODO: Forgotten password handler
 */

function ResetPassword() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
  };
  return (
    <Container component="main" maxWidth="desktop">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img alt="logo" src="logo.svg" width="150px" height="auto" />
        <Typography component="h1" variant="h5">
          Password Rescue
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3, pb: 2 }}>
          <Stack spacing={3}>
            <TextField
              aria-label="email-field"
              required
              fullWidth
              name="email"
              label="Email"
              id="email"
              autoComplete="email"
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Send password reset link
            </Button>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}
export default ResetPassword;
