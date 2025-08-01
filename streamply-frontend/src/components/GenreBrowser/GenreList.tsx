import { Box, Button, Menu, MenuItem, Zoom } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setGenres } from '../../store/slices/explorationSlice';

export const GenreList = () => {
  const { genres } = useAppSelector(state => state.videos);
  const { selectedGenres } = useAppSelector(state => state.exploration);
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [displayedGenres, setDisplayedGenres] = useState<string[]>(genres.slice(0, 3));
  const [restGenres, setRestGenres] = useState<string[]>(genres.slice(3));
  const open = Boolean(anchorEl);

  const handleGenreClick = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      dispatch(setGenres(selectedGenres.filter((selectedGenre: string) => selectedGenre !== genre)));
    } else {
      dispatch(setGenres([...selectedGenres, genre]));
    }
  };

  const handleMenuGenreAdd = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      dispatch(setGenres(selectedGenres.filter((selectedGenre: string) => selectedGenre !== genre)));
      setRestGenres(prev => [...prev, genre]);
    } else {
      dispatch(setGenres([...selectedGenres, genre]));
      setDisplayedGenres(prev => [...prev, genre]);
      setRestGenres(prev => [...prev.filter(options => options !== genre)]);
      setAnchorEl(null);
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      {displayedGenres.map(genre => (
        <Zoom in={Boolean(genre)} key={`display-${genre}`}>
          <Button
            variant={selectedGenres.includes(genre) ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: selectedGenres.includes(genre) ? 'primary.600' : 'transparent',
            }}
            onClick={() => {
              handleGenreClick(genre);
            }}
          >
            {genre}
          </Button>
        </Zoom>
      ))}
      <Button
        onClick={handleMenuOpen}
        variant="outlined"
        disabled={restGenres.length === 0}
        sx={{ borderColor: 'primary.600', color: 'primary.600', borderRadius: '40px' }}
      >
        <Add sx={{ color: 'white', fontSize: '20px' }} />
      </Button>
      <Menu
        id="genre-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        sx={{ borderColor: 'primary.600', color: 'primary.600', p: '0.5rem', borderRadius: '40px' }}
        slotProps={{ paper: { sx: { backgroundColor: 'secondary.400' } } }}
      >
        {restGenres.map(genre => (
          <MenuItem
            sx={{
              backgroundColor: 'secondary.400',
              color: 'white',
              '&:hover': { backgroundColor: 'secondary.400', color: 'primary.600' },
            }}
            key={genre}
            onClick={() => {
              handleMenuGenreAdd(genre);
            }}
          >
            {genre}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
