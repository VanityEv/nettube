import Footer from "../components/Footer";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import SearchBar from "../components/SearchBar";

function Series() {
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

export default Series;
