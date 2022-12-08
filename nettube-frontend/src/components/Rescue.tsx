import * as React from "react";
import { Box, Typography, Container, CssBaseline, TextField, Button} from "@mui/material";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";

/**
 * TODO: Forgotten password handler
 */

 function Rescue() {
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
            Password Rescue
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3, pb: 2 }}
          >
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Send password reset link
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
export default Rescue;