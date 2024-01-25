import { ThemeProvider } from '@mui/system';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import Profile from './pages/Profile';
import { createContext, useMemo } from 'react';
import { ResetPassword } from './pages/ResetPassword';
import ConfirmRegister from './pages/ConfirmRegister';
import AppBar from './components/AppBar';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { MoviePlayer } from './pages/MoviePlayer';
import { Box, createTheme, CssBaseline } from '@mui/material';
import Dashboard from './pages/Dashboard';
import ProtectedRoute, { ProtectedRouteProps } from './ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VideoPage } from './components/VideoPage/VideoPage';
import { useSnackbar } from './hooks/useSnackbar';
import { Snackbar } from './components/Snackbar';
import { Movies } from './pages/Movies';
import Series from './pages/Series';
import { EpisodePlayer } from './pages/EpisodePlayer';

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

type SnackbarContextType = {
  showSnackbar: (message: string, severity: 'success' | 'error' | 'info') => void;
};

export const SnackbarContext = createContext<SnackbarContextType>({
  showSnackbar: () => {},
});

const App = () => {
  const theme = useMemo(
    () =>
      createTheme({
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
            main: '#FFFFFF',
            '600': '#e51445',
            '500': '#271389',
            '400': '#423098',
            '300': '#6a5dae',
            '200': '#9389c4',
            '100': '#c9c4e2',
          },
          secondary: {
            main: '#e51445',
            '500': '#0f0f0f',
            '400': '#0b0815',
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
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                color: 'white',
                display: 'flex',
                flexWrap: 'nowrap',
                height: '3rem',
                borderColor: '#e51445',
                backgroundColor: 'transparent',
                borderRadius: '40px',
                textTransform: 'capitalize',
                fontWeight: '600',
                '&:hover': { borderColor: '#e51445', backgroundColor: '#e51445' },
              },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: {
                borderColor: '#423098',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: '#0b0815',
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              input: {
                color: 'white',
              },
            },
          },
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarColor: '#6b6b6b #2b2b2b',
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                  backgroundColor: '#2b2b2b',
                },
                '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                  borderRadius: 8,
                  backgroundColor: '#6b6b6b',
                  minHeight: 24,
                  border: '3px solid #2b2b2b',
                },
                '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                  backgroundColor: '#959595',
                },
                '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                  backgroundColor: '#959595',
                },
                '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#959595',
                },
                '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
                  backgroundColor: '#2b2b2b',
                },
              },
            },
          },
        },
      }),
    []
  );

  const queryClient = new QueryClient();

  const defaultProtectedRouteProps: Omit<ProtectedRouteProps, 'outlet'> = {
    authenticationPath: '/signin',
  };

  const [snackbarState, showSnackbar, hideSnackbar] = useSnackbar();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <SnackbarContext.Provider value={{ showSnackbar }}>
          <CssBaseline />
          <AppBar />
          <Box
            sx={{
              mt: '4.5rem',
              backgroundColor: 'secondary.400',
              minHeight: 'calc(100vh - 4.5rem)',
              height: 'calc(100vh - 4.5rem)',
              width: '100vw',
              overflowY: 'scroll',
            }}
          >
            {snackbarState !== null && (
              <Snackbar
                isOpen={true}
                message={snackbarState.message}
                severity={snackbarState.severity}
                onClose={hideSnackbar}
              />
            )}
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/confirm-register" element={<ConfirmRegister />} />

              <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<HomePage />} />} path="/" />

              <Route
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Profile />} />}
                path="/profile"
              />
              <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Movies />} />} path="/movies" />
              <Route element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Series />} />} path="/series" />

              <Route
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Dashboard />} />}
                path="/dashboard"
              />
              <Route
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<VideoPage />} />}
                path="/series/:title"
              />

              <Route
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<VideoPage />} />}
                path="/movies/:title"
              />

              <Route
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<MoviePlayer />} />}
                path="/movie/:title"
              />
              <Route
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<EpisodePlayer />} />}
                path="/series/:title/season/:season/episode/:episode"
              />
            </Routes>
          </Box>
          {/* <Divider sx={{ margin: '24px 0' }} />
      <Footer /> */}
        </SnackbarContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
