import { Box, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import Comments, { CommentsList } from "../components/Comments";
import useHttp from "../hooks/useHttp";
import { useAppSelector } from "../hooks/useRedux";

type Props = {};

const Player = (props: Props) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));
	const location = useLocation();
	const showId = location.state.showId;
	const title = location.state.title;
	const [showLink, setShowLink] = useState("");
	const { isLoading, error, sendRequest } = useHttp();
	const comments = useAppSelector((state) => state.reviews.reviews);
	const selectedComments = comments.filter((comment) => {
		return comment.show_id === showId && comment.grade === null;
	});

	useEffect(() => {
		const getVideoLink = async () => {
			const response = await sendRequest({
				method: "GET",
				endpoint: `/videos/titles/${title}`,
			});
			setShowLink(response.link);
		};
		getVideoLink();
	}, [sendRequest, title]);

	return (
		<Box display="flex" flexDirection="column" alignItems="center">
			<Box
				width="90%"
				display="flex"
				flexDirection="column"
				alignItems="center"
				paddingBottom={3}
			>
				{!isLoading && (
					<iframe
						width="100%"
						height={isMobile ? "480" : "720"}
						src={showLink}
						title={showLink}
						allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					></iframe>
				)}
				{isLoading && <CircularProgress />}
				{error && <Typography>Something went wrong!</Typography>}
			</Box>
			{!isLoading && <Comments showId={showId} comments={selectedComments} />}
		</Box>
	);
};

export default Player;
