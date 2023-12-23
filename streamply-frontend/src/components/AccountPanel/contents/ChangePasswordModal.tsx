import { Box, Button, IconButton, Modal, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Close } from '@mui/icons-material';
import { SERVER_ADDR, SERVER_PORT } from '../../../constants';
import axios from 'axios';
import { useUserStore } from '../../../state/userStore';
import { getCookie } from 'typescript-cookie';

export const ChangePasswordModal = () => {
  const { username } = useUserStore();
  const [open, setOpen] = useState(false);
  const handleOpenChange = () => {
    setOpen(prev => !prev);
  };

  const ChangePasswordSchema = z
    .object({
      oldPassword: z.string().min(2),
      newPassword: z
        .string()
        .min(2, { message: 'Please enter valid password.' })
        .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
      confirmPassword: z.string().min(2, { message: 'Please enter valid password.' }),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: `Passwords don't match`,
      path: ['confirmPassword'],
    });

  type Schema = z.infer<typeof ChangePasswordSchema>;

  const form = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Schema) => {
    try {
      const response = await axios.post(SERVER_ADDR + ':' + SERVER_PORT + '/user/changePassword', {
        username: username,
        token: getCookie('userToken'),
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      if (response.status === 200) {
        //TODO: PASSWORD CHANGE SNACKBAR
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Button
        sx={{ backgroundColor: 'primary.600', width: { mobile: '30%', desktop: '10%' } }}
        onClick={handleOpenChange}
      >
        Change Password
      </Button>
      <Modal
        open={open}
        sx={{
          height: 'auto',
          display: 'flex',
          backgroundColor: 'secondary.400',
          p: 4,
        }}
      >
        <>
          <IconButton onClick={handleOpenChange} sx={{ position: 'absolute', top: 0, right: 0, mr: 4, mt: 3 }}>
            <Close sx={{ color: 'white', fontSize: '2.5rem' }} />
          </IconButton>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 'auto' }}>
            <Box
              component="form"
              noValidate
              onSubmit={form.handleSubmit(onSubmit)}
              sx={{ mt: 3, pb: 2, width: { mobile: '100%', tablet: '50%', desktop: '25%' } }}
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
                  name="oldPassword"
                  control={form.control}
                  defaultValue=""
                  render={({ field: { ref, ...field } }) => (
                    <TextField
                      aria-label="old-password-field"
                      required
                      label="Old Password"
                      type="password"
                      id="old-password"
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
                  name="newPassword"
                  control={form.control}
                  defaultValue=""
                  render={({ field: { ref, ...field } }) => (
                    <TextField
                      aria-label="new-password-field"
                      required
                      label="New Password"
                      type="password"
                      id="new-password"
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
                      label="Password"
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
                  Confirm Change
                </Button>
              </Stack>
            </Box>
          </Box>
        </>
      </Modal>
    </>
  );
};
