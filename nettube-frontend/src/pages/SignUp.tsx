import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DesktopDatePicker, MobileDatePicker } from '@mui/x-date-pickers';
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
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Stack, useMediaQuery } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../constants';
import useHttp from '../hooks/useHttp';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { uiActions } from '../store/ui';
import { useNavigate } from 'react-router-dom';

export const swapMonthDay = (date: string) => {
  let [year, day, month] = date.split('-');
  return year + '-' + month + '-' + day;
};

function SignUp() {
  const [isError, setIsError] = useState({
    email: false,
    password: false,
    confirm: false,
  });

  const todayDate = dayjs();
  const navigate = useNavigate();
  const snackbar = useAppSelector(state => state.ui.snackbar);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [value, setValue] = useState<Dayjs | null>(dayjs('2000-01-01T00:00:00'));
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  const { sendRequest } = useHttp();

  const handleChange = (newValue: Dayjs | null) => {
    setValue(newValue);
  };
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errorCheck = { password: true, confirm: true, email: true };
    const data = new FormData(event.currentTarget);
    if (data.get('password') !== data.get('confirm-password')) {
      errorCheck.confirm = false;
      setIsError(prevState => ({ ...prevState, confirm: false }));
    }
    if (!PASSWORD_REGEX.test(data.get('password') as string)) {
      errorCheck.password = false;
      setIsError(prevState => ({ ...prevState, password: true }));
    }
    if (!EMAIL_REGEX.test(data.get('email') as string)) {
      errorCheck.email = false;
      setIsError(prevState => ({ ...prevState, email: true }));
    }
    if (errorCheck.confirm && errorCheck.email && errorCheck.password) {
      setIsError({ confirm: false, email: false, password: false });
      let birthdateFixed = data.get('birthdate') as string;
      birthdateFixed = birthdateFixed.replace(/\//g, '-');
      birthdateFixed = swapMonthDay(birthdateFixed);
      const response = await sendRequest({
        method: 'POST',
        body: {
          username: data.get('username') as string,
          fullname: data.get('fullname') as string,
          email: data.get('email') as string,
          birthdate: birthdateFixed,
          password: data.get('password') as string,
          subscription: data.get('radio-buttons-subscription-label') as unknown as number,
        },
        endpoint: '/user/signup',
      });
      if (!response.error && response.result === 'SUCCESS') {
        dispatch(
          uiActions.onShowSnackbar({
            snackbar: {
              content: 'The account has been created!',
              severity: 'success',
            },
          })
        );
        setTimeout(() => {
          dispatch(uiActions.onHideSnackbar());
        }, 3000);
        navigate('/signin');
      } else {
        setIsError({ ...errorCheck });
        dispatch(
          uiActions.onShowSnackbar({
            snackbar: {
              content: response.error,
              severity: 'error',
            },
          })
        );
        setTimeout(() => {
          dispatch(uiActions.onHideSnackbar());
        }, 3000);
      }
    }
    /**
     * sendRequest({method:'POST', body:{data.get('email') as string}, endpoint:'checkEmail'})
     */
  };
  return (
    <Container component="main" maxWidth="desktop">
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={snackbar.isOpened}>
        <Alert
          onClose={() => {
            dispatch(
              uiActions.onShowSnackbar({
                snackbar: {
                  content: 'Invalid credentials!',
                  severity: 'error',
                },
              })
            );
            setTimeout(() => {
              dispatch(uiActions.onHideSnackbar());
            }, 3000);
          }}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.content}
        </Alert>
      </Snackbar>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img alt="logo" src="logo.svg" width="150px" height="auto" />
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3, pb: 2 }}>
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
              helperText={isError.email && 'Email is incorrect!'}
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {!isMobile ? (
                <DesktopDatePicker
                  aria-label="birthdate-field"
                  label="Birth date"
                  inputFormat="YYYY/DD/MM"
                  value={value}
                  onChange={handleChange}
                  maxDate={todayDate}
                  renderInput={params => <TextField name="birthdate" {...params} />}
                />
              ) : (
                <MobileDatePicker
                  aria-label="birthdate-field"
                  label="Birthdate"
                  inputFormat="YYYY/DD/MM"
                  value={value}
                  onChange={handleChange}
                  maxDate={todayDate}
                  renderInput={params => <TextField name="birthdate" {...params} />}
                />
              )}
            </LocalizationProvider>
            <TextField
              error={isError.password}
              aria-label="password-field"
              required
              fullWidth
              helperText={isError.password && 'Password is not strong enough!'}
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
            />
            <TextField
              error={isError.confirm}
              helperText={isError.confirm && 'Passwords do not match!'}
              aria-label="password-field"
              required
              fullWidth
              name="confirm-password"
              label="Confirm Password"
              type="password"
              id="confirm-password"
            />
            <FormLabel id="radio-buttons-subscription-label">Choose subscription type</FormLabel>
            <RadioGroup
              aria-labelledby="radio-buttons-subscription-label"
              defaultValue="0"
              name="radio-buttons-subscription-label"
            >
              <FormControlLabel value={0} control={<Radio />} label="Standard" />
              <FormControlLabel value={1} control={<Radio />} label="Premium" />
              <FormControlLabel value={2} control={<Radio />} label="Ultimate" />
            </RadioGroup>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Sign Up
            </Button>
            <Link href="/signin" variant="body1">
              Already have an account? Sign in
            </Link>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}
export default SignUp;
