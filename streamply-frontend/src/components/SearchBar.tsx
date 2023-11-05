import { uiActions } from '../store/ui';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { InputAdornment, InputBase, TextField } from '@mui/material';
import { Search } from '@mui/icons-material';

function SearchBar() {
  const dispatch = useAppDispatch();
  const searchValue = useAppSelector(state => state.ui.searchValue);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(uiActions.onChangeSearchValue(event.target.value));
  };

  return (
    <InputBase
      placeholder="Search videos..."
      sx={{
        backgroundColor: 'white',
        borderRadius: '60px',
        py: 1,
        pl: '12px',
        mr: { mobile: 0, desktop: 2 },
        opacity: 0.9,
      }}
      startAdornment={
        <InputAdornment position="start">
          <Search color="primary" />
        </InputAdornment>
      }
      value={searchValue}
      onChange={handleSearchChange}
    />
  );
}
export default SearchBar;
