import Footer from "../components/Footer";
import MediaCard from "../components/MediaCard";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import SearchBar from "../components/SearchBar";


function Genres() {
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

export default Genres;
