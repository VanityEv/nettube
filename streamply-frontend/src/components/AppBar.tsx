import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import {
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { uiActions } from '../store/ui';

const pages = ['movies', 'series', 'genres'];
const settings = ['profile', 'signout'];

function ResponsiveAppBar() {
  const username = localStorage.getItem('username');
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isSearchShown = useAppSelector(state => state.ui.isSearchShown);
  const selectedTheme = useAppSelector(state => state.ui.theme);
  const dispatch = useAppDispatch();
  const isUserLoggedIn = Boolean(localStorage.getItem('username'));

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    localStorage.removeItem('userToken');
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    console.log(localStorage.getItem('account_type'));
    setAnchorElUser(null);
  };

  const handleSwitchClick = () => {
    dispatch(uiActions.onChangeTheme());
  };

  /**
   * TODO: zachowanie SearchBar - w widoku mobile powinna być lupa, po kliknięciu której rozwija się search.
   * Obecnie lupa nakłada się na Open settings - bug
   * <AdbIcon sx={{ display: { mobile: "none", desktop: "flex" }, mr: 1 }} />
   */
  return (
    <AppBar position="fixed" color="primary" sx={{ height: '4.5rem' }}>
      <Container sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <Toolbar disableGutters sx={{ width: '100%', justifyContent: 'space-between' }}>
          <Link style={{ textDecoration: 'none', marginRight: '12px' }} to={'/'}>
            <img alt="logo" src="logo.svg" width="40px" height="auto" />
          </Link>
          <Box sx={{ flexGrow: 1, display: { mobile: 'flex', desktop: 'none' } }}>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { mobile: 'block', desktop: 'none' },
              }}
            >
              {pages.map((page, key) => (
                <MenuItem key={key} onClick={handleCloseNavMenu}>
                  <Link style={{ textDecoration: 'none' }} to={'/' + page}>
                    <Typography textAlign="center">{page.toUpperCase()}</Typography>
                  </Link>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { mobile: 'none', desktop: 'flex' } }}>
            {pages.map((page, key) => (
              <Link style={{ textDecoration: 'none' }} key={key} to={'/' + page}>
                <Button
                  key={page}
                  onClick={handleCloseNavMenu}
                  sx={{ mt: 1.5, mb: 2, color: 'white', display: 'block', fontWeight: '600', fontSize: '16px' }}
                >
                  {page}
                </Button>
              </Link>
            ))}
          </Box>
          {isSearchShown && <SearchBar />}
          {isUserLoggedIn && (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar sx={{ backgroundColor: 'primary.200', color: 'secondary.300' }} />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {localStorage.getItem('account_type') === '3' ? (
                  <MenuItem key={'dashboard'} onClick={handleCloseUserMenu}>
                    <Link style={{ textDecoration: 'none', color: 'inherit' }} key={'dashboard'} to={'/dashboard'}>
                      <Typography textAlign="center">Dashboard</Typography>
                    </Link>
                  </MenuItem>
                ) : null}
                {settings.map((setting, key) => (
                  <MenuItem key={key} onClick={handleCloseUserMenu}>
                    <Link style={{ textDecoration: 'none', color: 'inherit' }} key={key} to={'/' + setting}>
                      <Typography textAlign="center">{setting[0].toUpperCase() + setting.slice(1)}</Typography>
                    </Link>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
