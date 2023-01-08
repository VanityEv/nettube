import { ThemeProvider } from '@mui/system';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Genres from './pages/Genres';
import HomePage from './pages/HomePage';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Profile from './pages/Profile';
import Footer from './components/Footer';
import { useEffect } from 'react';
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
import { createTheme, CssBaseline, Divider, Paper } from '@mui/material';
import Dashboard from './components/Dashboard';

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
    xl: false;
    mobile: true;
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
  const themeMode = useAppSelector(state => state.ui.theme);

  const theme = createTheme({
    breakpoints: {
      values: {
        mobile: 0,
        desktop: 1024,
      },
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 16,
      circle: '50%',
    },
    palette: {
      mode: themeMode,
    },
  });

  useEffect(() => {
    dispatch(fetchVideosData());
    dispatch(fetchReviewsData());
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchVideosData());
    dispatch(fetchReviewsData());
  }, [dispatch]);

  useEffect(() => {
    dispatch(uiActions.onChangeRoute({ route: location.pathname.slice(1) }));
  }, [dispatch, location]);
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/series" element={<Series />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-register" element={<ConfirmRegister />} />
        <Route path="/signout" element={<Signout />} />
        <Route path="/watch" element={<Player />} />
      </Routes>
      <Divider sx={{ margin: '24px 0' }} />
      <Footer />
    </ThemeProvider>
  );
};

export default App;
