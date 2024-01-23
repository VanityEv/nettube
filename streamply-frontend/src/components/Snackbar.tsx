import { Alert, AlertColor, Snackbar as MUISnackbar } from '@mui/material';
import React from 'react';

type SnackbarProps = {
  message: string;
  severity: AlertColor | undefined;
  isOpen: boolean;
  onClose: () => void;
};

export const Snackbar = ({ message, severity, isOpen, onClose }: SnackbarProps) => {
  return (
    <MUISnackbar open={isOpen} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={onClose}>
      <Alert onClose={onClose} severity={severity}>
        {message}
      </Alert>
    </MUISnackbar>
  );
};
