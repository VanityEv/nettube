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
import Register from "./pages/Register";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

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
					<Route path="/Login" element={<Login/>}/>
					<Route path="/Register" element={<Register/>}/>
					<Route path="/Rescue" element={<ResetPassword/>}/>
				</Routes>
				<Footer />
			</BrowserRouter>
		</ThemeProvider>
	);
};

export default App;
