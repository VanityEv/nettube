import Carousel from "../components/Carousel";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import Movies from "./Movies";

const links = [
	"https://wallpapercave.com/wp/wp3982534.jpg",
	"https://wallpaperaccess.com/full/5486200.jpg",
	"https://images2.alphacoders.com/879/879599.png",
];

function HomePage() {
	return (
		<>
			<ResponsiveAppBar />
			<div>
				<Carousel links={links} />
				<Movies />
			</div>
		</>
	);
}

export default HomePage;
