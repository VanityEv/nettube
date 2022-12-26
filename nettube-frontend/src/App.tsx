import { ThemeProvider } from "@mui/system";
import theme from "./styles/theme";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import Genres from "./pages/Genres";
import HomePage from "./pages/HomePage";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Profile from "./pages/Profile";
import Footer from "./components/Footer";
import { useEffect } from "react";
import { fetchVideosData } from "./store/videos-actions";
import { useAppDispatch } from "./hooks/useRedux";
import ResetPassword from "./pages/ResetPassword";
import { fetchReviewsData } from "./store/reviews-actions";
import ConfirmRegister from "./pages/ConfirmRegister";
import AppBar from "./components/AppBar";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { uiActions } from "./store/ui";
import Signout from "./pages/Signout";

/**TODO: hook do nawigowania na /login jeśli user jest nieautoryzowany
 *   const navigate = useNavigate();
  const token = localStorage.getItem("userToken");
  if (!token) {
    navigate("/login");
  }
 * 
 */
const App = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchVideosData());
    dispatch(fetchReviewsData());
  }, [dispatch]);

  useEffect(() => {
    dispatch(uiActions.onChangeRoute({ route: location.pathname.slice(1) }));
  }, [dispatch, location]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    // if (!token) {
    // 	navigate("/Login");
    // }
  }, [navigate]);
  return (
    <ThemeProvider theme={theme}>
      <AppBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/series" element={<Series />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-register" element={<ConfirmRegister />} />
        <Route path="/signout" element={<Signout />} />
      </Routes>
      <Footer />
    </ThemeProvider>
  );
};

export default App;
