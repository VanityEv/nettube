import Grid2 from "@mui/material/Unstable_Grid2";
import MediaCard from "./MediaCard";
import { useAppSelector } from "../hooks/useRedux";

/**
 * TODO: zrobić z VideoList reużywalny komponent do wyświetlania różnych materiałów filmowych w zależności od parametrów lub stanu redux (lepiej parametr)
 */
const VideosList = () => {
	const videos = useAppSelector((state) => state.videos.videos);

	return (
		<>
			<Grid2 container spacing={2} sx={{ maxWidth: "100%" }}>
				{videos.map((item, key) => (
					<Grid2
						key={key}
						mobile={12}
						desktop={3}
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						<MediaCard {...item} descr={item.descr} />
					</Grid2>
				))}
			</Grid2>
		</>
	);
};

export default VideosList;
