import { AlertColor } from '@mui/material';
import { useState } from 'react';

type SnackbarState = {
  message: string;
  severity: AlertColor | undefined;
};

export const useSnackbar = () => {
  const [snackbarState, setSnackbarState] = useState<SnackbarState | null>(null);

  const showSnackbar = (message: string, severity: AlertColor) => {
    setSnackbarState({ message: message, severity: severity });
    setTimeout(hideSnackbar, 2000);
  };

  const hideSnackbar = () => {
    setSnackbarState(null);
  };

  return [snackbarState, showSnackbar, hideSnackbar] as const;
};
