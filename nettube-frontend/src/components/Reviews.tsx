import { Stack, Rating, Typography, Avatar, Divider, Grid, Paper } from "@mui/material";
import type { Review } from "../store/reviews.types";

type ReviewsProps = {
	reviews: Review[];
};

type ReviewItemProps = {
	comment: string;
	grade: number;
	user_id: number;
};

/**
 * TODO: poprawić css do bloku komentarza bo dla mobile nie clipuje się w modalu
 * (dokładniej dłuższy tekst wychodzi poza paper) - BUG
 */

function ReviewItem({ comment, grade, user_id }: ReviewItemProps) {
	return (
		<Paper style={{ padding: "40px 20px" }} elevation={4}>
			<Grid container wrap="nowrap" spacing={2}>
				<Grid item>
					<Avatar src="assets/images/avatar.png" />
				</Grid>
				<Grid
					sx={{
						justifyContent: "left",
					}}
				>
					<h4 style={{ margin: 0, textAlign: "left" }}>{user_id}</h4>
					<Rating name="read-only" value={grade / 2} precision={0.5} readOnly />
					<Typography sx={{ textAlign: "left" }}>{comment}</Typography>
				</Grid>
			</Grid>
			<Divider variant="fullWidth" style={{ margin: "30px 0" }} />
		</Paper>
	);
}

const Reviews = (props: ReviewsProps) => {
	const { reviews } = props;
	const reviewsWithoutComments = reviews.filter((review) => review.grade !== null);

	return (
		<Stack
			spacing={2}
			sx={{
				display: "flex",
				width: "100%",
				textOverflow: "clip",
				flexGrow: 1,
			}}
		>
			{reviewsWithoutComments.map((item) => (
				<ReviewItem {...item} key={item.id} />
			))}
		</Stack>
	);
};

export default Reviews;
