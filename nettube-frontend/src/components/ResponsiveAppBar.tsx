import * as React from "react";
import AppBar from "@mui/material/AppBar";
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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useTheme } from "@material-ui/core";

const pages = ["Movies", "Series", "Genres"];
const settings = ["Profile", "Account", "Dashboard", "Logout"];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const theme = useTheme();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    //setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  /**
   * TODO: zachowanie SearchBar - w widoku mobile powinna być lupa, po kliknięciu której rozwija się search.
   * Obecnie lupa nakłada się na Open settings - bug
   * <AdbIcon sx={{ display: { mobile: "none", desktop: "flex" }, mr: 1 }} />
   */
  return (
    <AppBar position="sticky" color="primary">
      <Container>
        <Toolbar disableGutters>
          <Link style={{ textDecoration: "none" }} to={"/"}>
            <img src="logo.svg" width="70px" height="auto" />
            <Typography
              variant="h6"
              noWrap
              sx={{
                mr: 2,
                display: { mobile: "none", desktop: "flex" },
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".1rem",
                color: theme.palette.common.white,
                textDecoration: "none",
              }}
            >
              NetTube
            </Typography>
          </Link>
          <Box
            sx={{ flexGrow: 1, display: { mobile: "flex", desktop: "none" } }}
          >
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { mobile: "block", desktop: "none" },
              }}
            >
              {pages.map((page, key) => (
                <MenuItem key={key} onClick={handleCloseNavMenu}>
                  <Link style={{ textDecoration: "none" }} to={"/" + page}>
                    <Typography textAlign="center">{page}</Typography>
                  </Link>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { mobile: "flex", desktop: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            NetTube
          </Typography>

          <Box
            sx={{ flexGrow: 1, display: { mobile: "none", desktop: "flex" } }}
          >
            {pages.map((page, key) => (
              <Link
                style={{ textDecoration: "none" }}
                key={key}
                to={"/" + page}
              >
                <Button
                  key={page}
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: "white", display: "block" }}
                >
                  {page}
                </Button>
              </Link>
            ))}
          </Box>
          <SearchBar />
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting, key) => (
                <MenuItem key={key} onClick={handleCloseUserMenu}>
                  <Link
                    style={{ textDecoration: "none" }}
                    key={key}
                    to={"/" + setting}
                  >
                    <Typography textAlign="center">{setting}</Typography>
                  </Link>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
