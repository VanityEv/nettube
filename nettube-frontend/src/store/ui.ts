import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  searchValue: string;
  isSearchShown: boolean;
  theme: 'light' | 'dark';
};

const initialState: UiState = {
  searchValue: '',
  isSearchShown: true,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    onChangeSearchValue(state, action: PayloadAction<string>) {
      state.searchValue = action.payload;
    },
    onChangeRoute(state, action: PayloadAction<{ route: string }>) {
      if (action.payload.route === 'signin' || action.payload.route === 'signup') {
        state.isSearchShown = false;
      } else state.isSearchShown = true;
    },
    onChangeTheme(state) {
      state.theme === 'light' ? (state.theme = 'dark') : (state.theme = 'light');
    },
  },
});

export const uiActions = uiSlice.actions;
export default uiSlice;
