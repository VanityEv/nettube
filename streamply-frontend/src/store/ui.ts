import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertColor } from '@mui/material';
type UiState = {
  searchValue: string;
  isSearchShown: boolean;
  theme: 'light' | 'dark';
  snackbar: SnackbarType;
};

export type SnackbarType = {
  content: string;
  isOpened: boolean;
  severity: AlertColor | undefined;
};

const initialState: UiState = {
  searchValue: '',
  isSearchShown: true,
  theme: 'light',
  snackbar: {
    severity: undefined,
    isOpened: false,
    content: '',
  },
};

const forbiddenRoutes = ['signin', 'signup', 'profile', 'dashboard'];

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    onChangeSearchValue(state, action: PayloadAction<string>) {
      state.searchValue = action.payload;
    },
    onChangeRoute(state, action: PayloadAction<{ route: string }>) {
      if (forbiddenRoutes.includes(action.payload.route)) {
        state.isSearchShown = false;
      } else state.isSearchShown = true;
    },
    onChangeTheme(state) {
      state.theme === 'light' ? (state.theme = 'dark') : (state.theme = 'light');
    },
    onShowSnackbar(state, action: PayloadAction<{ snackbar: { severity: AlertColor | undefined; content: string } }>) {
      state.snackbar = { ...action.payload.snackbar, isOpened: true };
    },
    onHideSnackbar(state) {
      state.snackbar = initialState.snackbar;
    },
  },
});

export const uiActions = uiSlice.actions;
export default uiSlice;
