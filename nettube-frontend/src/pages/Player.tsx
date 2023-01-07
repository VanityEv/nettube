import { Box, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import Comments from "../components/Comments";
import Likes from "../components/Likes";
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
	const [likes, setLikes] = useState<Array<{ user_id: number; username: string }>>([]);

	const { isLoading, error, sendRequest } = useHttp();
	const comments = useAppSelector((state) => state.reviews.reviews);
	const loggedUserUsername = useAppSelector((state) => state.user.username);
	const selectedComments = comments.filter((comment) => {
		return comment.show_id === showId && comment.grade === null;
	});

	const likesCount = likes.length;
	const liked = likes.filter((item) => item.username === loggedUserUsername).length > 0;

	const onLikeClick = async () => {
		await sendRequest({
			method: "POST",
			endpoint: `/reviews/showLikes/setLike`,
			body: {
				username: loggedUserUsername,
				value: liked ? 0 : 1,
				video_id: showId,
			},
		});
		const getVideoLikes = async () => {
			const response = await sendRequest({
				method: "GET",
				endpoint: `/reviews/showLikes/${showId}`,
			});
			setLikes(response.data);
		};
		getVideoLikes();
	};

	useEffect(() => {
		const getVideoLink = async () => {
			const response = await sendRequest({
				method: "GET",
				endpoint: `/videos/titles/${title}`,
			});
			setShowLink(response.link);
		};
		const getVideoLikes = async () => {
			const response = await sendRequest({
				method: "GET",
				endpoint: `/reviews/showLikes/${showId}`,
			});
			setLikes(response.data);
		};
		getVideoLink();
		getVideoLikes();
	}, [sendRequest, showId, title]);

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
			<Likes
				onLikeClick={onLikeClick}
				liked={liked}
				count={likesCount}
				width="90%"
				justifyContent="flex-end"
			/>
			{!isLoading && <Comments showId={showId} comments={selectedComments} />}
		</Box>
	);
};

export default Player;
