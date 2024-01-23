import { Box, Typography, Container, TextField, Button, SxProps } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SignalResponse } from '../types/response.types';
import { api } from '../constants';
import { useContext } from 'react';
import { SnackbarContext } from '../App';

export const ResetPassword = () => {

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');
  const token = queryParams.get('token');
  const navigate = useNavigate();
  const {showSnackbar} = useContext(SnackbarContext);

  const ResetPasswordSchema = z
    .object({
      password: z
        .string()
        .min(2, { message: 'Please enter valid password.' })
        .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {message: 'Password is not secure enough'}),
      confirmPassword: z.string().min(2),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: `Passwords don't match`,
      path: ['confirmPassword'],
    });

  type Schema = z.infer<typeof ResetPasswordSchema>;

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (data: Schema) => {
    if(!email || !token) {
      showSnackbar('Error resetting password! Please click link on your mail once again.', 'error');
      return;
    }
    try {
      const response = await axios.post<SignalResponse>(`${api}/user/setPassword`, {email: email, token: token, password: data.password });
      if(response.data.result === 'SUCCESS') {
        showSnackbar('Password reset completed! You can log in now.', 'success');
        navigate('/signin')
      }
    } catch (error) {
      showSnackbar('Error while resetting password', 'error');
    }
  };

  const fieldSx: SxProps = {
    input: { color: 'white' },
    width: {
      mobile: '90%',
      desktop: '50%',
    },
    '&>div>fieldset': { borderColor: 'primary.600' },
    '& .MuiOutlinedInput-root:hover': {
      '& > fieldset': {
        borderColor: 'white',
      },
    },
  };
  return (
    <Container component="main" maxWidth="desktop">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width:'100%'
        }}
      >
        <img alt="logo" src="logo-text-dark.svg" width="300px" height="auto" style={{ marginBottom: '1rem' }} />
        <Typography component="h1" variant="h5" sx={{ color: 'white' }}>
          Password Rescue
        </Typography>
        <Box
        component="form"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        sx={{ mt: 3, pb: 2, width: { mobile: '100%', tablet: '50%', desktop: '75%' }, display:'flex', flexDirection:'column', gap: 3, alignItems:'center' }}
      >
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
                sx={fieldSx}
                error={!!form.formState.errors.password}
                helperText={form.formState.errors.password?.message}
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
                sx={fieldSx}
                error={!!form.formState.errors.confirmPassword}
                helperText={form.formState.errors.confirmPassword?.message}
                inputRef={ref}
                {...field}
                variant="outlined"
              />
            )}
          />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, backgroundColor: 'primary.600', width:'auto' }}>
              Send password reset link
            </Button>
        </Box>
      </Box>
    </Container>
  );
};
