import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DesktopDatePicker, MobileDatePicker } from "@mui/x-date-pickers";
import {
  Link,
  Box,
  Typography,
  Container,
  TextField,
  Button,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Stack, useMediaQuery } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { EMAIL_REGEX, PASSWORD_REGEX } from "../constants";
import useHttp from "../hooks/useHttp";

function SignUp() {
  const [isError, setIsError] = useState({
    email: false,
    password: false,
    confirmpassword: false,
  });
  const theme = useTheme();
  const [value, setValue] = useState<Dayjs | null>(
    dayjs("2000-01-01T00:00:00")
  );
  const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));
  const { sendRequest } = useHttp();

  const handleChange = (newValue: Dayjs | null) => {
    setValue(newValue);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") != data.get("confirm-password")) {
      setIsError((prevState) => ({ ...prevState, confirmpassword: true }));
    }
    if (!PASSWORD_REGEX.test(data.get("password") as string)) {
      setIsError((prevState) => ({ ...prevState, password: true }));
    }
    if (!EMAIL_REGEX.test(data.get("email") as string)) {
      setIsError((prevState) => ({ ...prevState, email: true }));
    }
    console.log(
      !isError.confirmpassword && !isError.email && !isError.password
    );
    if (!isError.confirmpassword && !isError.email && !isError.password) {
      let birthdateFixed = data.get("birthdate") as string;
      birthdateFixed = birthdateFixed.replace(/\//g, "-");
      sendRequest({
        method: "POST",
        body: {
          username: data.get("username") as string,
          fullname: data.get("fullname") as string,
          email: data.get("email") as string,
          birthdate: birthdateFixed,
          password: data.get("password") as string,
        },
        endpoint: "/user/signup",
      });
    }
    /**
     * sendRequest({method:'POST', body:{data.get('email') as string}, endpoint:'checkEmail'})
     */
  };
  return (
    <Container component="main" maxWidth="desktop">
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
              error={isError.email}
              aria-label="email-field"
              required
              fullWidth
              helperText={isError.email && "Email is incorrect!"}
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
                  inputFormat="YYYY/DD/MM"
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
                  inputFormat="YYYY/DD/MM"
                  value={value}
                  onChange={handleChange}
                  renderInput={(params) => (
                    <TextField name="birthdate" {...params} />
                  )}
                />
              )}
            </LocalizationProvider>
            <TextField
              error={isError.password}
              aria-label="password-field"
              required
              fullWidth
              helperText={isError.password && "Password is not strong enough!"}
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
            />
            <TextField
              error={isError.confirmpassword}
              helperText={isError.confirmpassword && "Passwords do not match!"}
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
  );
}
export default SignUp;
