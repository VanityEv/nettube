import "./App.css";
import MediaCard from "./components/MediaCard";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import ResponsiveAppBar from "./components/ResponsiveAppBar";
import SearchBar from "./components/SearchBar";
import Carousel from "./components/Carousel";

export type TestCardProps = {
	title: string;
	alt: string;
	description: string;
	thumbnail: string;
};

const TestCard: TestCardProps = {
	title: "Testowy",
	alt: "alter",
	thumbnail: "bleach.png",
	description: "testowy description",
};
const TestCard2: TestCardProps = {
	title: "Testowy2",
	alt: "alter2",
	thumbnail: "",
	description: "testowy description2",
};

const DUMMY:TestCardProps[] = [];
for (let i = 0; i < 10; i++) {
	DUMMY.push(TestCard);
}

const links = [
	"https://placeimg.com/640/480/animals",
	"https://placeimg.com/640/480/nature",
	"https://placeimg.com/640/480/architecture",
];

function App() {
	return (
		<>
			<nav>
				<ResponsiveAppBar />
			</nav>
			<div className="wrapping">
				<SearchBar />
				<Carousel links={links} />
				<Grid2 container spacing={2}>
					{DUMMY.map((item) => (
						<Grid2 xs={12} md={3}>
							<MediaCard {...item} />
						</Grid2>
					))}
				</Grid2>
			</div>
		</>
	);
}

export default App;
