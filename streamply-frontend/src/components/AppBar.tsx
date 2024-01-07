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
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { useContext, useState } from 'react';
import { SearchModal } from './SearchModal/SearchModal';
import { getCookie } from 'typescript-cookie';
import { useVideosStore } from '../state/videosStore';
import { SnackbarContext } from '../App';

const pages = ['movies', 'series'];
const settings = ['profile'];

function ResponsiveAppBar() {
  const { username, avatarUrl } = useUserStore();
  const [searchModalOpen, setSeachModalOpen] = useState(false);
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const isUserLoggedIn = Boolean(username);
  const { reset: resetVideos } = useVideosStore();
  const { reset: resetUser } = useUserStore();
  const { showSnackbar } = useContext(SnackbarContext);

  const handleSearchModalChange = () => {
    setSeachModalOpen(prev => !prev);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSignout = () => {
    showSnackbar(`You've been logged out!`, 'info');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('account_type');
    resetUser();
    resetVideos();
  };

  return (
    <AppBar
      position="fixed"
      color="primary"
      sx={{
        height: '4.5rem',
        backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.05), rgba(11, 8, 21, 0.75))',
        backgroundColor: 'primary.400',
      }}
    >
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
                  sx={{
                    mt: 1.5,
                    mb: 2,
                    color: 'white',
                    ':hover': { backgroundColor: 'transparent' },
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '16px',
                  }}
                >
                  {page}
                </Button>
              </Link>
            ))}
          </Box>
          <SearchModal open={searchModalOpen} onClose={handleSearchModalChange} />
          {isUserLoggedIn && (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar src={avatarUrl ?? ''} sx={{ backgroundColor: 'primary.200', color: 'secondary.300' }} />
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
                {getCookie('userAccountType') === '3' && (
                  <MenuItem key={'dashboard'} onClick={handleCloseUserMenu}>
                    <Link style={{ textDecoration: 'none', color: 'inherit' }} key={'dashboard'} to={'/dashboard'}>
                      <Typography textAlign="center" sx={{ color: 'white', '&:hover': { color: 'primary.600' } }}>
                        Dashboard
                      </Typography>
                    </Link>
                  </MenuItem>
                )}

                {settings.map((setting, key) => (
                  <Link key={key} style={{ textDecoration: 'none', color: 'inherit' }} to={'/' + setting}>
                    <MenuItem onClick={handleCloseUserMenu}>
                      <Typography textAlign="center" sx={{ color: 'white', '&:hover': { color: 'primary.600' } }}>
                        {setting[0].toUpperCase() + setting.slice(1)}
                      </Typography>
                    </MenuItem>
                  </Link>
                ))}
                <MenuItem
                  onClick={() => {
                    handleCloseUserMenu();
                    handleSignout();
                  }}
                >
                  <Link style={{ textDecoration: 'none', color: 'inherit' }} to={'/signin'}>
                    <Typography textAlign="center" sx={{ color: 'white', '&:hover': { color: 'primary.600' } }}>
                      Signout
                    </Typography>
                  </Link>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
