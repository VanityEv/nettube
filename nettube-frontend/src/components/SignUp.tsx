import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { DesktopDatePicker, MobileDatePicker } from "@mui/x-date-pickers";
import {Link, Box, Typography, Container, CssBaseline, TextField, Button, FormControlLabel, FormLabel, Radio, RadioGroup, FormControl} from "@mui/material";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { Stack, useMediaQuery } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { EMAIL_REGEX, PASSWORD_REGEX } from "../constants";

/**
 * TODO: naprawić wyświetlanie daty na mobilnym (albo nie umiem wyrażeń tenarnych albo MobileDatePicker nie działa)
 * Nie wyświetla poprawnego inputa dla mobile ale w sumie to ujdzie po testach dla mobile
 * TODO: zachowanie po wykryciu niepoprawnego hasła/niewystarczająco silnego hasła/maila, register handler
 */
 function SignUp() {
  const theme = useTheme();
  const [value, setValue] = React.useState<Dayjs | null>(
    dayjs("2000-01-01T00:00:00")
  );
  const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));
  const handleChange = (newValue: Dayjs | null) => {
    setValue(newValue);
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") != data.get("confirm-password")) {
      alert("Password do not match!");
    }
    if (!PASSWORD_REGEX.test(data.get("password") as string)) {
      alert("Password is not strong enough!");
    }
    if (!EMAIL_REGEX.test(data.get("email") as string)) {
      alert("Email is incorrect!");
    }
    console.log({
      email: data.get("birthdate"),
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
            Sign up
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
                aria-label="fullname-field"
                name="fullname"
                required
                fullWidth
                id="fullname"
                label="Full Name"
                autoFocus
              />
              <TextField
                aria-label="email-field"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                {!isMobile ? (
                  <DesktopDatePicker
                    aria-label="birthdate-field"
                    label="Date desktop"
                    inputFormat="MM/DD/YYYY"
                    value={value}
                    onChange={handleChange}
                    renderInput={(params) => (
                      <TextField name="birthdate" {...params} />
                    )}
                  />
                ) : (
                  <MobileDatePicker
                    aria-label="birthdate-field"
                    label="Date mobile"
                    inputFormat="MM/DD/YYYY"
                    value={value}
                    onChange={handleChange}
                    renderInput={(params) => (
                      <TextField name="birthdate" {...params} />
                    )}
                  />
                )}
              </LocalizationProvider>
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
              <TextField
                aria-label="password-field"
                required
                fullWidth
                name="confirm-password"
                label="Confirm Password"
                type="password"
                id="confirm-password"
              />
              <FormLabel id="radio-buttons-subscription-label">
                Choose subscription type
              </FormLabel>
              <RadioGroup
                
                aria-labelledby="radio-buttons-subscription-label"
                defaultValue="standard"
                name="radio-buttons-subscription-label"
              >
                <FormControlLabel
                  value="standard"
                  control={<Radio />}
                  label="Standard"
                />
                <FormControlLabel
                  value="premium"
                  control={<Radio />}
                  label="Premium"
                />
                <FormControlLabel
                  value="ultimate"
                  control={<Radio />}
                  label="Ultimate"
                />
              </RadioGroup>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign Up
              </Button>
              <Link href="/Login" variant="body1">
                Already have an account? Sign in
              </Link>
            </Stack>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
export default SignUp;