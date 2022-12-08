import { Rating, Typography, Avatar, Divider } from "@mui/material";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";

export type ReviewBlockProps = {
  comment: string;
  grade: number;
  user_id: number;
};
const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: "center",
  color: theme.palette.text.secondary,
  width: "",
  height: "auto",
  lineHeight: "60px",
}));

/**
 * TODO: poprawić css do bloku komentarza bo dla mobile nie clipuje się w modalu
 * (dokładniej dłuższy tekst wychodzi poza paper) - BUG
 */

function ReviewBlock({ comment, grade, user_id }: ReviewBlockProps) {
  return (
    <Paper style={{ padding: "40px 20px" }} elevation={4}>
      <Grid container wrap="nowrap" spacing={2}>
        <Grid item>
          <Avatar alt="Remy Sharp" />
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
export default ReviewBlock;
