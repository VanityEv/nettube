import { Box, Typography, Stack, TextField, Button, Link } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { useUserStore } from '../state/userStore';
import { setCookie } from 'typescript-cookie';
import { useNavigate } from 'react-router-dom';

type LoginResponse = {
  username: string;
  token: string;
  account_type: number;
};

export const SignInPanel = () => {
  const { setUserData } = useUserStore();
  const navigate = useNavigate();
  const FormSchema = z.object({
    username: z.string().min(2, {
      message: 'Please enter valid username.',
    }),
    password: z.string().min(2, { message: 'Please enter valid password.' }),
  });

  type Schema = z.infer<typeof FormSchema>;

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Schema) => {
    try {
      const loginResponse = await axios.post<LoginResponse>(SERVER_ADDR + ':' + SERVER_PORT + '/user/signin', {
        ...data,
      });
      if (loginResponse.status === 200) {
        setUserData(loginResponse.data.username);
        setCookie('userToken', loginResponse.data.token);
        navigate('/');
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
        Sign in
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
          <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2, px: 8, backgroundColor: 'primary.600' }}>
            Sign In
          </Button>
          <Link href="/reset-password" variant="body1">
            Forgot password?
          </Link>
          <Link href="/signup" variant="body1">
            Not a member? Register now!
          </Link>
        </Stack>
      </Box>
    </Box>
  );
};
