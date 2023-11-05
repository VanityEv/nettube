import { ThumbUpAlt, ThumbUpOffAlt } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import React from "react";

type LikesProps = {
	width: string;
	justifyContent: string;
	liked: boolean;
	count: number;
	onLikeClick: () => void;
};

const Likes = (props: LikesProps) => {
	const { width, justifyContent, count, liked } = props;

	const handleLikeClick = () => {
		props.onLikeClick();
	};
	return (
		<Box
			width={width}
			display="flex"
			flexDirection="row"
			alignItems="center"
			justifyContent={justifyContent}
		>
			<Typography paddingRight={1}>{count ?? 0}</Typography>
			<IconButton onClick={handleLikeClick}>
				{liked ? <ThumbUpAlt /> : <ThumbUpOffAlt />}
			</IconButton>
		</Box>
	);
};

export default Likes;
