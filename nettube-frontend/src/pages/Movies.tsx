import  Modal from "../components/TransitionsModal";
import Footer from "../components/Footer";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import SearchBar from "../components/SearchBar";

function Movies() {
	return (
        <>
        <nav>
            <ResponsiveAppBar/>
        </nav>
        <div className="wrapping">
            <SearchBar />
        </div>
        <Footer/>
    </>
	);
}

export default Movies;
