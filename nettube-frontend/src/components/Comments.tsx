import { Avatar, Box, Divider, Grid, Paper, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import useHttp from "../hooks/useHttp";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { fetchReviewsData } from "../store/reviews-actions";
import { Review } from "../store/reviews.types";

type CommentProps =
	| {
			username: string;
			comment: string;
			type: "read";
	  }
	| {
			username: "You";
			showId: number;
			type: "add";
	  };
type CommentsProps = {
	comments: Review[];
	showId: number;
};

export type CommentsList = Array<{
	comment: string;
	grade: number;
	id: number;
	show_id: number;
	user_id: number;
	username: string;
}>;

const Comment = (props: CommentProps) => {
	const { username, type } = props;
	const [commentValue, setCommentValue] = useState("");
	const { sendRequest } = useHttp();
	const currentUserName = useAppSelector((state) => state.user.username);
	const dispatch = useAppDispatch();

	const handleKeyDown = async (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && props.type === "add") {
			const response = await sendRequest({
				method: "POST",
				endpoint: "/reviews/userReviews/addComment",
				body: {
					comment: commentValue,
					grade: null,
					show_id: props.showId,
					username: currentUserName,
				},
			});
			if (response.result === "SUCCESS") {
				dispatch(fetchReviewsData());
				setCommentValue("");
			}
		}
	};

	const handleCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCommentValue(event.target.value);
	};

	return (
		<Paper style={{ padding: "40px 20px", marginBottom: "24px" }} elevation={4}>
			<Grid container wrap="nowrap" spacing={2}>
				<Grid item>
					<Avatar alt="Remy Sharp" />
				</Grid>
				<Grid
					sx={{
						justifyContent: "left",
						width: "100%",
					}}
					item
				>
					<h4 style={{ margin: 0, textAlign: "left" }}>{username}</h4>
					{type === "read" && (
						<Typography sx={{ textAlign: "left" }}>{props.comment}</Typography>
					)}
					{type === "add" && (
						<TextField
							id="standard-basic"
							label="Comment"
							variant="standard"
							fullWidth
							onKeyDown={handleKeyDown}
							onChange={handleCommentChange}
							value={commentValue}
						/>
					)}
				</Grid>
			</Grid>
			<Divider variant="fullWidth" style={{ margin: "30px 0" }} />
		</Paper>
	);
};

const Comments = (props: CommentsProps) => {
	const { comments, showId } = props;

	return (
		<Box width="90%">
			<Typography variant="h4" paddingBottom={3}>
				Komentarze
			</Typography>

			<Comment showId={showId} username="You" type="add" />

			{comments.map((comment) => (
				<Comment {...comment} type="read" />
			))}
		</Box>
	);
};

export default Comments;
