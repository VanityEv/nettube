import { Box, Typography, Stack, TextField, Button, Link, SxProps } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { api } from '../constants';
import { useNavigate } from 'react-router-dom';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useContext } from 'react';
import { SnackbarContext } from '../App';

type RegisterResponse = {
  result: string;
};

export const SignUpPanel = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useContext(SnackbarContext);

  const fieldSx: SxProps = {
    input: { color: 'white' },
    width: {
      mobile: '75%',
      desktop: '50%',
      '& .MuiOutlinedInput-root:hover': {
        '& > fieldset': {
          borderColor: 'white',
        },
      },
    },
  }

  const SignUpSchema = z
    .object({
      username: z.string().min(2, {
        message: 'Please enter valid username.',
      }),
      fullname: z.string().min(2),
      email: z
        .string()
        .min(4, {
          message: 'Please enter valid email',
        })
        .email('This is not a valid email'),
      birthdate: z.instanceof(dayjs as unknown as typeof Dayjs),
      password: z
        .string()
        .min(2, { message: 'Please enter valid password.' })
        .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
      confirmPassword: z.string().min(2),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: `Passwords don't match`,
      path: ['confirmPassword'],
    });

  type Schema = z.infer<typeof SignUpSchema>;

  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      username: '',
      fullname: '',
      birthdate: dayjs(),
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (data: Schema) => {
    try {
      const birthdateAsDate = data.birthdate.format('YYYY-MM-DD');
      const signUpResponse = await axios.post<RegisterResponse>(`${api}/user/signup`, {
        ...data,
        birthdate: birthdateAsDate,
      });
      if (signUpResponse.status === 200) {
        showSnackbar('Account created. Please check your email to confirm your account.', 'success');
        navigate('/signin');
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 400:
            showSnackbar('Error while creating account', 'error');
            break;
          case 409:
            showSnackbar('This username or email are already in use.', 'error');
            break;
        }
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img alt="logo" src="logo-text-dark.svg" width="300px" height="auto" style={{ marginBottom: '1rem' }} />
      <Typography component="h1" variant="h5" color="white">
        Sign Up
      </Typography>
      <Box
        component="form"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        sx={{ mt: 3, pb: 2, width: { mobile: '100%', tablet: '50%', desktop: '75%' } }}
      >
        <Stack
          spacing={3}
          width="100%"
          sx={{
            input: { color: 'white' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '&>div>div>fieldset': { borderColor: 'primary.600' },
          }}
        >
          <Controller
            name="username"
            control={form.control}
            render={({ field: { ref, ...field } }) => (
              <TextField
                aria-label="username-field"
                required
                id="username"
                label="Username"
                autoFocus
                error={!!form.formState.errors.username}
                helperText={form.formState.errors.username?.message}
                sx={fieldSx}
                inputRef={ref}
                {...field}
              />
            )}
          />
          <Controller
            name="fullname"
            control={form.control}
            defaultValue=""
            render={({ field: { ref, ...field } }) => (
              <TextField
                aria-label="fullname-field"
                required
                id="fullname"
                label="Full Name"
                autoFocus
                error={!!form.formState.errors.fullname}
                helperText={form.formState.errors.fullname?.message}
                sx={fieldSx}
                inputRef={ref}
                {...field}
              />
            )}
          />
          <Controller
            name="email"
            control={form.control}
            defaultValue=""
            render={({ field: { ref, ...field } }) => (
              <TextField
                aria-label="email-field"
                required
                id="email"
                label="Email"
                error={!!form.formState.errors.email}
                helperText={form.formState.errors.email?.message}
                autoFocus
                sx={fieldSx}
                inputRef={ref}
                {...field}
              />
            )}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Controller
              name="birthdate"
              control={form.control}
              render={({ field: { ref, ...field } }) => (
                <DatePicker
                  label={'Birth date'}
                  views={['year', 'month', 'day']}
                  format="YYYY-MM-DD"
                  inputRef={ref}
                  maxDate={dayjs()}
                  minDate={dayjs('1900-01-01')}
                  {...field}
                  sx={fieldSx}
                  slotProps={{
                    inputAdornment: {
                      sx: {
                        '.MuiSvgIcon-root': {
                          color: 'white',
                        },
                      },
                    },
                    layout: {
                      sx: {
                        '.MuiDateCalendar-root': {
                          color: '#e51445',
                          borderRadius: '40px',
                          border: '1px solid #e51445',
                          mt: 1,
                        },
                        '.MuiPickersDay-root': {
                          color: 'white',
                        },
                        '.MuiPickersDay-root:focus': {
                          backgroundColor: '#e51445',
                        },
                        '.MuiPickersLayout-root': {
                          p: 2,
                        },
                        '.Mui-selected:hover': {
                          backgroundColor: '#e51445',
                        },
                        '.Mui-selected': {
                          backgroundColor: '#e51445',
                        },
                        '.MuiSvgIcon-root': {
                          color: 'white',
                        },
                        '.MuiTypography-root': {
                          color: 'white',
                        },
                      },
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
          <Controller
            name="password"
            control={form.control}
            defaultValue=""
            render={({ field: { ref, ...field } }) => (
              <TextField
                aria-label="password-field"
                required
                label="Password"
                type="password"
                id="password"
                error={!!form.formState.errors.password}
                helperText={form.formState.errors.password?.message}
                sx={fieldSx}
                inputRef={ref}
                {...field}
                variant="outlined"
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            defaultValue=""
            render={({ field: { ref, ...field } }) => (
              <TextField
                aria-label="confirm-password-field"
                required
                label="Confirm Password"
                type="password"
                id="confirm-password"
                error={!!form.formState.errors.confirmPassword}
                helperText={form.formState.errors.confirmPassword?.message}
                sx={fieldSx}
                inputRef={ref}
                {...field}
                variant="outlined"
              />
            )}
          />
          <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2, px: 8, backgroundColor: 'primary.600' }}>
            Sign Up
          </Button>
          <Typography color="white">Already have an account?</Typography>
          <Link href="/signin" fontSize={20}>
            Sign In
          </Link>
        </Stack>
      </Box>
    </Box>
  );
};
