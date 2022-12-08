import { Box, Rating, Typography } from "@mui/material";
import { Review } from "../store/reviews.types";
import Grid2 from "@mui/material/Unstable_Grid2";

export type ReviewBlockProps = {
  comment: string;
  grade: number;
  user_id: number;
};

function ReviewBlock({ comment, grade, user_id }: ReviewBlockProps) {
  return (
    <Grid2
      mobile={12}
      desktop={3}
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Typography>
        {user_id}
        <Rating name="read-only" value={grade / 2} precision={0.5} readOnly />
      </Typography>
      <Typography>{comment}</Typography>
    </Grid2>
  );
}
export default ReviewBlock;
