import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface ExplorationState {
  selectedGenres: string[];
  searchValue: string;
}

// Initial state
const initialState: ExplorationState = {
  selectedGenres: [],
  searchValue: '',
};

// Slice
const explorationSlice = createSlice({
  name: 'exploration',
  initialState,
  reducers: {
    setGenres: (state, action: PayloadAction<string[]>) => {
      state.selectedGenres = action.payload;
    },
    setSearchValue: (state, action: PayloadAction<string>) => {
      state.searchValue = action.payload;
    },
    reset: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const { setGenres, setSearchValue, reset } = explorationSlice.actions;

export default explorationSlice.reducer;