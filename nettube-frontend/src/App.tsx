import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Genres from "./pages/Genres";
import HomePage from "./pages/HomePage"
import Movies from "./pages/Movies";
import Series from "./pages/Series";

function App() {
	return (
		<BrowserRouter>
		<Routes>
			<Route path='/' element={<HomePage/>}/>
			<Route path='/Movies' element={<Movies/>}/>
			<Route path='/Series' element={<Series/>}/>
			<Route path='/Genres' element={<Genres/>}/>
		</Routes>
		</BrowserRouter>
	);
}

export default App;
