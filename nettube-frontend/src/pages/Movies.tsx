import { Box } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import MediaCard from "../components/MediaCard";
import { useAppSelector } from "../hooks/reduxHooks";

function Movies() {
	const videos = useAppSelector((state) => state.videos.videos);

	return (
		<>
			<Grid2 container spacing={2} sx={{ maxWidth: "100%" }}>
				{videos.map((item, key) => (
					<Grid2
						key={key}
						mobile={12}
						desktop={3}
						sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
					>
						<MediaCard {...item} />
					</Grid2>
				))}
			</Grid2>
		</>
	);
}

export default Movies;
