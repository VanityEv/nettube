import * as React from "react";
import {Link, Box, Typography, Container, CssBaseline, TextField, Button, FormControlLabel, FormLabel, Radio, RadioGroup, FormControl} from "@mui/material";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { Stack, useMediaQuery } from "@mui/material";

/**
 * TODO: Login handler
 */

 function SignIn() {
  const theme = useTheme();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      username: data.get("username"),
      password: data.get("password"),
    });
  };
  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="desktop">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img src="logo.svg" width="150px" height="auto" />
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3, pb: 2 }}
          >
            <Stack spacing={3}>
              <TextField
                aria-label="username-field"
                name="username"
                required
                fullWidth
                id="username"
                label="Username"
                autoFocus
              />
              <TextField
                aria-label="password-field"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Link href="/Rescue" variant="body1">
                Forgot password?
              </Link>
              <Link href="/Register" variant="body1">
                Not a member? Register now!
              </Link>
            </Stack>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
export default SignIn;