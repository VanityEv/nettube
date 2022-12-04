import { ThemeProvider } from "@mui/system";
import theme from "./styles/theme";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(fetchVideosData());
	}, [dispatch]);

	return (
		<ThemeProvider theme={theme}>
			<BrowserRouter>
				<ResponsiveAppBar />
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/Movies" element={<Movies />} />
					<Route path="/Series" element={<Series />} />
					<Route path="/Genres" element={<Genres />} />
					<Route path="/Profile" element={<Profile />} />
				</Routes>
				<Footer />
			</BrowserRouter>
		</ThemeProvider>
	);
};

export default App;
