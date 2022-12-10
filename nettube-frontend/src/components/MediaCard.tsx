import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Favorite from "@mui/icons-material/Favorite";
import IconButton from "@mui/material/IconButton";
import TransitionsModal from "./TransitionsModal";
import { useMediaQuery, useTheme } from "@mui/material";
import { Video } from "../store/videos.types";

export default function MediaCard({
  id,
  tier,
  title,
  type,
  genre,
  production_year,
  production_country,
  age_restriction,
  grade,
  reviews_count,
  alt,
  descr,
  thumbnail,
}: Video) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));

  return (
    <Card
      sx={{
        maxWidth: 345,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <CardMedia
        component="img"
        image={thumbnail}
        alt={alt}
        sx={{ objectFit: "contain" }}
      />
      <CardContent>
        <Typography
          gutterBottom
          variant="h5"
          component="div"
          textAlign="center"
        >
          {title}
        </Typography>
        {!isMobile && (
          <Typography variant="body2" color="text.secondary">
            {descr}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <IconButton aria-label="add to favorites">
          <Favorite />
        </IconButton>
        <IconButton aria-label="play">
          <TransitionsModal
            id={id}
            tier={tier}
            title={title}
            type={type}
            genre={genre}
            production_year={production_year}
            production_country={production_country}
            age_restriction={age_restriction}
            grade={grade}
            reviews_count={reviews_count}
            alt={alt}
            descr={descr}
            thumbnail={thumbnail}
          />
        </IconButton>
      </CardActions>
    </Card>
  );
}
