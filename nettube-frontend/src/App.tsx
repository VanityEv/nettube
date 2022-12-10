import { ThemeProvider } from "@mui/system";
import theme from "./styles/theme";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Genres from "./pages/Genres";
import HomePage from "./pages/HomePage";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Profile from "./pages/Profile";
import ResponsiveAppBar from "./components/ResponsiveAppBar";
import Footer from "./components/Footer";
import { useEffect } from "react";
import { fetchVideosData } from "./store/videos-actions";
import { useAppDispatch } from "./hooks/reduxHooks";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import { fetchReviewsData } from "./store/reviews-actions";

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

	useEffect(() => {
		dispatch(fetchVideosData());
		dispatch(fetchReviewsData());
	}, [dispatch]);

	useEffect(() => {
		const token = localStorage.getItem("userToken");
		// if (!token) {
		// 	navigate("/Login");
		// }
	}, [navigate]);
	return (
		<ThemeProvider theme={theme}>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/Movies" element={<Movies />} />
				<Route path="/Series" element={<Series />} />
				<Route path="/Genres" element={<Genres />} />
				<Route path="/Profile" element={<Profile />} />
				<Route path="/Login" element={<Login />} />
				<Route path="/Register" element={<Register />} />
				<Route path="/Rescue" element={<ResetPassword />} />
			</Routes>
			<Footer />
		</ThemeProvider>
	);
};

export default App;
