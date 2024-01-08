import { Box, Button, IconButton, Modal, TextField, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { SnackbarContext } from '../App';
import { Close } from '@mui/icons-material';
import axios from 'axios';
import { api } from '../constants';
import { SignalResponse } from '../types/response.types';

export const ResendConfirmationModal = () => {
  const [open, setOpen] = useState(false);
  const [emailField, setEmailField] = useState('');
  const { showSnackbar } = useContext(SnackbarContext);

  const handleOpenChange = () => {
    setOpen(prev => !prev);
  };

  const handleResend = async () => {
    try {
      const response = await axios.post<SignalResponse>(`${api}/user/resendConfirmation`, { email: emailField });
      if (response.data.result === 'SUCCESS') {
        showSnackbar('Confirmation email was sent', 'success');
      }
    } catch (error) {
      showSnackbar(`Couldn't find user with provided email`, 'error');
    }
  };

  return (
    <>
      <Typography sx={{ color: 'white' }} onClick={handleOpenChange}>
        Resend Confirmation Link
      </Typography>
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              height: 'auto',
              gap: '2rem',
              '&>div>div>fieldset': { borderColor: 'primary.600' },
            }}
          >
            <TextField label="Email" value={emailField} onChange={e => setEmailField(e.target.value)}></TextField>
            <Button onClick={handleResend} sx={{ backgroundColor: 'primary.600' }}>
              Resend Confirmation Email
            </Button>
          </Box>
        </>
      </Modal>
    </>
  );
};
