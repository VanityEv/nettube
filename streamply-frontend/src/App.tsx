import { ThemeProvider } from '@mui/system';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Genres from './pages/Genres';
import HomePage from './pages/HomePage';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Profile from './pages/Profile';
import { useEffect, useMemo } from 'react';
import { fetchVideosData } from './store/videos-actions';
import { useAppDispatch, useAppSelector } from './hooks/useRedux';
import ResetPassword from './pages/ResetPassword';
import { fetchReviewsData } from './store/reviews-actions';
import ConfirmRegister from './pages/ConfirmRegister';
import AppBar from './components/AppBar';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { uiActions } from './store/ui';
import Signout from './pages/Signout';
import { userLogin } from './store/user-actions';
import Player from './pages/Player';
import { Box, createTheme, CssBaseline, Divider } from '@mui/material';
import Dashboard from './pages/Dashboard';
import ProtectedRoute, { ProtectedRouteProps } from './ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**TODO: hook do nawigowania na /login jeśli user jest nieautoryzowany
 *   const navigate = useNavigate();
  const token = localStorage.getItem("userToken");
  if (!token) {
    navigate("/login");
  }
 * 
 */
declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: false;
    sm: false;
    md: false;
    lg: false;
    xl: true;
    mobile: true;
    tablet: true;
    desktop: true;
  }
  interface Theme {
    radius: {
      sm: number;
      md: number;
      lg: number;
      circle: string;
    };
  }
  interface ThemeOptions {
    radius?: {
      sm: number;
      md: number;
      lg: number;
      circle: string;
    };
  }
}

const App = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const getDesignTokens = () => ({
    breakpoints: {
      values: {
        mobile: 0,
        tablet: 640,
        desktop: 1024,
        xl: 1920,
      },
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 16,
      circle: '50%',
    },
    palette: {
      primary: {
        main: '#190482',
        '500': '#271389',
        '400': '#423098',
        '300': '#6a5dae',
        '200': '#9389c4',
        '100': '#c9c4e2',
      },
      secondary: {
        main: '#000000',
        '500': '#0f0f0f',
        '400': '#1e1e1e',
        '300': '#2d2d2d',
        '200': '#878787',
        '100': 'ffffff',
      },
      text: {
        primary: '#000000',
        secondary: '#ffffff',
        disabled: '#bdbdbd',
      },
    },
  });

  const theme = useMemo(() => createTheme(getDesignTokens()), []);

  const queryClient = new QueryClient();

  useEffect(() => {
    dispatch(fetchVideosData());
    dispatch(fetchReviewsData());
  }, [dispatch]);

  useEffect(() => {
    dispatch(uiActions.onChangeRoute({ route: location.pathname.slice(1) }));
  }, [dispatch, location]);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const username = localStorage.getItem('username');
    if (token && username) {
      dispatch(userLogin({ token, username }));
    }
  }, [dispatch, navigate]);

  const defaultProtectedRouteProps: Omit<ProtectedRouteProps, 'outlet'> = {
    isAuthenticated: !!localStorage.getItem('username'),
    authenticationPath: '/signin',
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar />
        <Box sx={{ height: 'calc(100vh - 4.5rem)', mt: '4.5rem', backgroundColor: 'secondary.200' }}>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/confirm-register" element={<ConfirmRegister />} />

            <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<HomePage />} />} path="/" />

            <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Movies />} />} path="/movies" />

            <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Series />} />} path="/series" />

            <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Genres />} />} path="/genres" />

            <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Profile />} />} path="/profile" />

            <Route
              element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Dashboard />} />}
              path="/dashboard"
            />

            <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Signout />} />} path="/signout" />

            <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Player />} />} path="/watch" />
          </Routes>
        </Box>
        {/* <Divider sx={{ margin: '24px 0' }} />
      <Footer /> */}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
