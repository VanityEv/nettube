import { useState } from "react";
import { Box, Modal, Fade, Typography, Rating } from "@mui/material";
import { PlayCircle } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Video } from "../store/videos.types";
import { useAppSelector } from "../hooks/reduxHooks";
import { Stack } from "@mui/material";
import ReviewBlock from "./ReviewBlock";

export default function TransitionsModal({
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
  const reviews = useAppSelector((state) => state.reviews.reviews);
  const selectedReviews = reviews.filter((review) => {
    return review.show_id === id;
  });
  const [isOpen, setIsOpen] = useState(false);
  const handleIsOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "90%" : "70%",
    height: isMobile ? "90%" : "70%",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: isMobile ? 2 : 4,
    objectFit: "contain",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
  };

  return (
    <>
      <PlayCircle onClick={handleIsOpen} />
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={isOpen}
        onClose={handleClose}
        closeAfterTransition
      >
        <Fade in={isOpen}>
          <Box sx={style}>
            <img
              style={{ flexGrow: 1, height: isMobile ? "50%" : "auto" }}
              src={thumbnail}
              alt={alt}
            />
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexGrow: 1,
                padding: "1rem",
                overflowY: "auto",
              }}
            >
              <Typography
                id="transition-modal-title"
                variant="h3"
                component="h2"
                textAlign="center"
              >
                {title}
              </Typography>
              <Typography
                id="transition-modal-description"
                sx={{ mt: 2 }}
                textAlign="center"
              >
                {descr}
              </Typography>
              <Typography
                gutterBottom
                variant="subtitle1"
                component="div"
                textAlign="center"
                sx={{ mt: 2 }}
              >
                Production type: {type === "series" ? "Series" : "Movie"}
              </Typography>
              <Typography
                gutterBottom
                variant="subtitle1"
                component="div"
                textAlign="center"
              >
                Genre: {genre}
              </Typography>
              <Typography
                gutterBottom
                variant="subtitle1"
                component="div"
                textAlign="center"
              >
                Production year: {production_year}
              </Typography>
              <Typography
                gutterBottom
                variant="subtitle1"
                component="div"
                textAlign="center"
              >
                Production country: {production_country}
              </Typography>
              <Typography
                gutterBottom
                variant="subtitle1"
                component="div"
                textAlign="center"
              >
                Age restrictions: {age_restriction} +
              </Typography>
              <Typography
                gutterBottom
                variant="subtitle1"
                component="div"
                textAlign="center"
              >
                Average grade:
                <Rating
                  name="read-only"
                  value={grade / 2}
                  precision={0.5}
                  readOnly
                />
                {grade}/10 ({reviews_count} reviews)
              </Typography>
              <Stack
                spacing={2}
                sx={{ display: "flex", width: "100%", textOverflow: "clip" }}
              >
                {selectedReviews.map((item) => (
                  <ReviewBlock {...item} key={item.id} />
                ))}
              </Stack>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
