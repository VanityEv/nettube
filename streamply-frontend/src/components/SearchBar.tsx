import { InputAdornment, InputBase, TextField } from '@mui/material';
import { Search } from '@mui/icons-material';
import { useState } from 'react';

function SearchBar() {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
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
