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
        {/* <Grid2 container spacing={2} sx={{maxWidth:'100%'}}>
					{DUMMY.map((item, key) => (
						<Grid2 key={key} mobile={12} desktop={3}>
							<MediaCard {...item} />
						</Grid2>
					))}
				</Grid2> */}
        <Movies />
      </div>
    </>
  );
}

export default HomePage;
