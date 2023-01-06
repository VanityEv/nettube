import { Box, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import useHttp from "../hooks/useHttp";
import { useAppSelector } from "../hooks/useRedux";

type Props = {};

const Player = (props: Props) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));
	const location = useLocation();
	const title = location.state.title;
	const [showLink, setShowLink] = useState("");
	const { isLoading, error, sendRequest } = useHttp();

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
			{!isLoading && (
				<iframe
					width={isMobile ? "100%" : "1280"}
					height={isMobile ? "480" : "720"}
					src={showLink}
					title={showLink}
					allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				></iframe>
			)}
			{isLoading && <CircularProgress />}
			{error && <Typography>Something went wrong!</Typography>}
		</Box>
	);
};

export default Player;
