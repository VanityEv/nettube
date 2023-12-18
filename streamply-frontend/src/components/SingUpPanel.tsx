import { Box, Typography, Stack, TextField, Button, Link } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useNavigate } from 'react-router-dom';
import { DatePicker, DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

type LoginResponse = {
  username: string;
  token: string;
  account_type: number;
};

export const SignUpPanel = () => {
  const navigate = useNavigate();
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
      birthdate: z
        .date({ required_error: 'Please provide birth date' })
        .min(new Date('1900-01-01'), { message: 'Invalid date' })
        .max(new Date(), { message: 'Invalid date' }),
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
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Schema) => {
    try {
      const signUpResponse = await axios.post<LoginResponse>(SERVER_ADDR + ':' + SERVER_PORT + '/user/signup', {
        ...data,
      });
      if (signUpResponse.status === 200) {
        navigate('/singin');
      }
    } catch (error) {
      console.error(error);
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
            defaultValue=""
            render={({ field: { ref, ...field } }) => (
              <TextField
                aria-label="username-field"
                required
                error={Boolean(form.formState.errors.username)}
                id="username"
                label="Username"
                autoFocus
                sx={{
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
                }}
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
                error={Boolean(form.formState.errors.fullname)}
                id="fullname"
                label="Full Name"
                autoFocus
                sx={{
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
                }}
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
                error={Boolean(form.formState.errors.email)}
                id="email"
                label="Email"
                autoFocus
                sx={{
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
                }}
                inputRef={ref}
                {...field}
              />
            )}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Controller
              name="birthdate"
              control={form.control}
              defaultValue={new Date()}
              render={({ field: { ref, ...field } }) => (
                <DatePicker
                  label={'Birth date'}
                  views={['year', 'month', 'day']}
                  inputRef={ref}
                  {...field}
                  renderInput={params => (
                    <TextField
                      name="birthdate"
                      sx={{
                        width: {
                          mobile: '75%',
                          desktop: '50%',
                          '& .MuiOutlinedInput-root:hover': {
                            '& > fieldset': {
                              borderColor: 'white',
                            },
                          },
                        },
                      }}
                      {...params}
                    />
                  )}
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
                sx={{
                  width: {
                    mobile: '75%',
                    desktop: '50%',
                    '& .MuiOutlinedInput-root:hover': {
                      '& > fieldset': {
                        borderColor: 'white',
                      },
                    },
                  },
                }}
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
                sx={{
                  width: {
                    mobile: '75%',
                    desktop: '50%',
                    '& .MuiOutlinedInput-root:hover': {
                      '& > fieldset': {
                        borderColor: 'white',
                      },
                    },
                  },
                }}
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
