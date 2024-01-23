import { Close, SearchOutlined } from '@mui/icons-material';
import { Box, Button, IconButton, Modal, Stack, SxProps, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useContext, useState } from 'react';
import { SignalResponse } from '../types/response.types';
import { api } from '../constants';
import { SnackbarContext } from '../App';

export const PasswordResetLinkModal = () => {
  const [emailField, setEmailField] = useState('');
  const [open, setOpen] = useState(false);
  const {showSnackbar} = useContext(SnackbarContext);

  const handleOpenChange = () => {
    setOpen(prev => !prev);
  };

  const handlePasswordReset = async () => {
    if (!emailField) return;
    try {
        const response = await axios.post<SignalResponse>(`${api}/user/resetPassword`, {email: emailField});
        if(response.data.result === 'SUCCESS') {
            showSnackbar('Reset link sent!', 'success');
        }
    } catch (error) {
        showSnackbar('Error while sending reset', 'error')
    }
  };

  const fieldSx: SxProps = {
    input: { color: 'white' },
    width: {
      mobile: '75%',
      desktop: '100%',
    },
    '&>div>fieldset': { borderColor: 'primary.600' },
    '& .MuiOutlinedInput-root:hover': {
      '& > fieldset': {
        borderColor: 'white',
      },
    },
  };

  return (
    <>
      <Typography sx={{ color: 'white', cursor: 'pointer' }} onClick={handleOpenChange}>
        Forgot password?
      </Typography>
      <Modal
        open={open}
        sx={{
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'secondary.400',
          alignItems: 'center',
          justifyContent:'center',
          p: 4,
        }}
      >
        <>
        <IconButton onClick={handleOpenChange} sx={{ position: 'absolute', top: 0, right: 0, mr: 4, mt: 3 }}>
            <Close sx={{ color: 'white', fontSize: '2.5rem' }} />
          </IconButton>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            height: 'auto',
            gap: '2rem',
            '&>div>div>div>fieldset': { borderColor: 'primary.600' },
          }}
        >
          <img alt="logo" src="logo-text-dark.svg" width="300px" height="auto" style={{ marginBottom: '1rem' }} />
          <Typography component="h1" variant="h5" sx={{ color: 'white' }}>
            Password Rescue
          </Typography>
          <Box component="form" noValidate onSubmit={handlePasswordReset} sx={{ mt: 3, pb: 2 }}>
            <Stack spacing={3}>
              <TextField label="Email" value={emailField} sx={fieldSx} onChange={e => setEmailField(e.target.value)}></TextField>
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, backgroundColor: 'primary.600' }}>
                Send password reset link
              </Button>
            </Stack>
          </Box>
        </Box>
        </>
      </Modal>
    </>
  );
};
