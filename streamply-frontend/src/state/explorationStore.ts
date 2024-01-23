import { create } from 'zustand';

type ExplorationState = {
  selectedGenres: string[];
  searchValue: string;
};

type ExplorationActions = {
  setGenres: (genres: string[]) => void;
  setSearchValue: (value: string) => void;
  reset: () => void;
};

const initialState: ExplorationState = {
  selectedGenres: [],
  searchValue: '',
};

export const useExplorationStore = create<ExplorationState & ExplorationActions>()(set => ({
  ...initialState,
  reset: () => {
    set(initialState);
  },
  setGenres: genres => {
    set(() => ({
      selectedGenres: genres,
    }));
  },
  setSearchValue: value => {
    set(() => ({
      searchValue: value,
    }));
  },
}));
