import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import { Delete, ExpandMore, Gavel } from "@mui/icons-material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import {
  Box,
  Button,
  Fade,
  IconButton,
  Modal,
  Rating,
  TextField,
  useMediaQuery,
} from "@mui/material";
import useHttp from "../hooks/useHttp";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { Video } from "../store/videos.types";

import theme from "../styles/theme";
import { fetchVideosData } from "../store/videos-actions";

export type UserEntry = {
  id: number;
  username: string;
  email: string;
};

//TODO: CSS - poprawki i layout
function AdminAccordion() {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const handleIsOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const [selectedType, setSelectedType] = useState<"film" | "series">("film");
  const { sendRequest } = useHttp();
  const videos = useAppSelector((state) => state.videos.videos);
  const [users, setUsers] = useState<UserEntry[] | []>([]);
  const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "90%" : "70%",
    height: isMobile ? "100%" : "70%",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: isMobile ? 2 : 12,
    objectFit: "contain",
    display: "grid",
  };
  const sendFetchUsersQuery = useCallback(async () => {
    const response = await sendRequest({
      method: "GET",
      endpoint: `/user/getAllUsers`,
    });
    if (response.result === "success") {
      setUsers(response.data);
    }
  }, []);

  const sendUserDeleteQuery = useCallback(async (id: number) => {
    const response = await sendRequest({
      method: "POST",
      body: {
        id: id,
      },
      endpoint: `/user/deleteUser`,
    });
    if (response.result === "success") {
      sendFetchUsersQuery();
    }
  }, []);

  const sendNewVideoQuery = useCallback(async (video: Video) => {
    const response = await sendRequest({
      method: "POST",
      body: {
        title: video.title,
        type: video.type,
        genre: video.genre,
        production_year: video.production_year,
        production_country: video.production_country,
        director: video.director,
        age_restriction: video.age_restriction,
        tags: video.tags,
        descr: video.descr,
        thumbnail: video.thumbnail,
        alt: video.alt,
        tier: video.tier,
        link: video.link,
      },
      endpoint: `/videos/addVideo`,
    });
    if (response.result === "success") {
      dispatch(fetchVideosData());
      handleClose();
    }
  }, []);

  const sendVideoDeleteQuery = useCallback(async (title: string) => {
    const response = await sendRequest({
      method: "POST",
      body: {
        title: title,
      },
      endpoint: `/videos/deleteVideo`,
    });
    if (response.result === "success") {
      dispatch(fetchVideosData());
    }
  }, []);

  const handleUserDelete = (id: number) => {
    sendUserDeleteQuery(id);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newVideo: Video = {
      id: -1,
      title: data.get("title") as string,
      type: selectedType,
      genre: data.get("genres") as string,
      production_year: parseInt(data.get("production_year") as string),
      production_country: data.get("production_country") as string,
      age_restriction: parseInt(data.get("age_restriction") as string),
      tags: data.get("tags") as string,
      director: data.get("director") as string,
      descr: data.get("descr") as string,
      thumbnail: data.get("thumbnail") as string,
      grade: 0,
      alt: data.get("alt") as string,
      tier: data.get("subscription_tier") as string,
      reviews_count: 0,
      link: data.get("link") as string,
    };
    sendNewVideoQuery(newVideo);
  };

  const handleOpenModal = (type: string) => {
    type === "film" ? setSelectedType("film") : setSelectedType("series");
    handleIsOpen();
  };
  const handleVideoDelete = (title: string) => {
    sendVideoDeleteQuery(title);
  };

  useEffect(() => {
    sendFetchUsersQuery();
  }, [sendFetchUsersQuery]);
  return (
    <Box sx={{ flexGrow: 3, pb: 3 }}>
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>Manage Users</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid2>
            <Grid2
              key="table-of-content"
              mobile={12}
              desktop={6}
              sx={{
                mx: "auto",
                width: 200,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                pl: "20px",
                boxShadow: "8px 8px 24px -21px rgba(66, 68, 90, 1)",
              }}
            >
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                textAlign={"center"}
              >
                {"User ID"}
                <Typography sx={{ pl: "30px", fontWeight: 500, minWidth: 300 }}>
                  {"Username"}
                </Typography>
                <Typography sx={{ pl: "30px", fontWeight: 500 }}>
                  {"Email address"}
                </Typography>
              </Box>
            </Grid2>
            {users.map((user, id) => (
              <Grid2
                key={user.username.toLowerCase() + id}
                mobile={12}
                desktop={6}
                sx={{
                  mx: "auto",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  pl: "20px",
                  boxShadow: "8px 8px 24px -21px rgba(66, 68, 90, 1)",
                }}
              >
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  textAlign={"center"}
                >
                  {user.id}
                  <Typography
                    sx={{ pl: "30px", fontWeight: 500, minWidth: 300 }}
                  >
                    {user.username}
                  </Typography>
                  <Typography sx={{ pl: "30px", fontWeight: 500 }}>
                    {user.email}
                  </Typography>
                </Box>
                <IconButton
                  sx={{ mr: "30px", fontSize: "12px" }}
                  onClick={() => {
                    handleUserDelete(user.id);
                  }}
                >
                  <Gavel />
                  Ban
                </IconButton>
              </Grid2>
            ))}
          </Grid2>
        </AccordionDetails>
      </Accordion>
      <Modal open={isOpen} onClose={handleClose} closeAfterTransition>
        <Fade in={isOpen}>
          <Box component="form" onSubmit={handleSubmit} sx={style}>
            Add New Video
            <TextField
              required
              id="title"
              label="title"
              name="title"
              defaultValue=""
              placeholder="Title"
              variant="standard"
            />
            <TextField
              required
              id="genres"
              name="genres"
              label="genres"
              defaultValue=""
              placeholder="Genres"
              variant="standard"
            />
            <TextField
              required
              id="production_year"
              name="production_year"
              label="production_year"
              defaultValue="1900"
              placeholder="Production Year"
              variant="standard"
            />
            <TextField
              required
              id="production_country"
              name="production_country"
              label="production_country"
              defaultValue=""
              placeholder="Production Country"
              variant="standard"
            />
            <TextField
              required
              id="director"
              name="director"
              label="director"
              defaultValue=""
              placeholder="Director"
              variant="standard"
            />
            <TextField
              required
              id="age_restriction"
              name="age_restriction"
              label="age_restriction"
              defaultValue="0"
              placeholder="Age Restrictions"
              variant="standard"
            />
            <TextField
              required
              id="tags"
              name="tags"
              label="tags"
              defaultValue=""
              placeholder="Tags"
              variant="standard"
            />
            <TextField
              required
              id="descr"
              name="descr"
              label="descr"
              defaultValue=""
              placeholder="Description"
              variant="standard"
            />
            <TextField
              required
              id="thumbnail"
              name="thumbnail"
              label="thumbnail"
              defaultValue=""
              placeholder="Thumbnail URL"
              variant="standard"
            />
            <TextField
              required
              id="alt"
              name="alt"
              label="alt"
              defaultValue=""
              placeholder="Alternate text"
              variant="standard"
            />
            <TextField
              required
              id="subscription_tier"
              name="subscription_tier"
              label="subscription_tier"
              defaultValue=""
              placeholder="Subscription Tier"
              variant="standard"
            />
            <TextField
              required
              id="link"
              name="link"
              label="link"
              defaultValue=""
              placeholder="Video link"
              variant="standard"
            />
            <Button
              type="submit"
              size="large"
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Confirm
            </Button>
          </Box>
        </Fade>
      </Modal>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>Manage Movies</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid2>
            <Grid2
              key={"addnewvideo"}
              mobile={12}
              desktop={6}
              sx={{
                mx: "auto",
                maxHeight: 150,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                pl: "20px",
                boxShadow: "8px 8px 24px -21px rgba(66, 68, 90, 1)",
              }}
            >
              <Box display="flex" flexDirection="row" alignItems="center">
                <IconButton
                  sx={{ fontSize: "12px" }}
                  onClick={() => handleOpenModal("film")}
                >
                  <img
                    src="https://cdn0.iconfinder.com/data/icons/circles-2/100/sign-square-dashed-plus-512.png"
                    className="review-thumbnail"
                  />
                  Add new Movie
                </IconButton>
              </Box>
            </Grid2>
            {videos.map((video, id) =>
              video.type === "film" ? (
                <Grid2
                  key={video.title.toLowerCase() + id}
                  mobile={12}
                  desktop={6}
                  sx={{
                    mx: "auto",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pl: "20px",
                    boxShadow: "8px 8px 24px -21px rgba(66, 68, 90, 1)",
                  }}
                >
                  <Box display="flex" flexDirection="row" alignItems="center">
                    <img src={video.thumbnail} className="review-thumbnail" />
                    <Typography
                      sx={{
                        pl: "30px",
                        letterSpacing: "1px",
                        fontWeight: 700,
                      }}
                    >
                      {video.title}
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="row" sx={{ ml: "30px" }}>
                    Average grade:
                    <Rating
                      name="read-only"
                      value={video.grade / 2}
                      precision={0.5}
                      readOnly
                      sx={{ pr: "15px" }}
                    />
                    {video.grade}/10 ({video.reviews_count} reviews)
                    <IconButton
                      sx={{ mr: "30px", fontSize: "12px" }}
                      onClick={() => {
                        handleVideoDelete(video.title);
                      }}
                    >
                      <Delete />
                      Delete
                    </IconButton>
                  </Box>
                </Grid2>
              ) : null
            )}
          </Grid2>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>Manage Series</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid2
            key={"addnewvideo"}
            mobile={12}
            desktop={6}
            sx={{
              mx: "auto",
              maxHeight: 150,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              pl: "20px",
              boxShadow: "8px 8px 24px -21px rgba(66, 68, 90, 1)",
            }}
          >
            <Box display="flex" flexDirection="row" alignItems="center">
              <IconButton
                sx={{ fontSize: "12px" }}
                onClick={() => {
                  handleOpenModal("series");
                }}
              >
                <img
                  src="https://cdn0.iconfinder.com/data/icons/circles-2/100/sign-square-dashed-plus-512.png"
                  className="review-thumbnail"
                />
                Add new Series
              </IconButton>
            </Box>
          </Grid2>
          <Grid2>
            {videos.map((video, id) =>
              video.type === "series" ? (
                <Grid2
                  key={video.title.toLowerCase() + id}
                  mobile={12}
                  desktop={6}
                  sx={{
                    mx: "auto",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pl: "20px",
                    boxShadow: "8px 8px 24px -21px rgba(66, 68, 90, 1)",
                  }}
                >
                  <Box display="flex" flexDirection="row" alignItems="center">
                    <img src={video.thumbnail} className="review-thumbnail" />
                    <Typography
                      sx={{ pl: "30px", letterSpacing: "1px", fontWeight: 700 }}
                    >
                      {video.title}
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="row" sx={{ ml: "30px" }}>
                    Average grade:
                    <Rating
                      name="read-only"
                      value={video.grade / 2}
                      precision={0.5}
                      readOnly
                      sx={{ pr: "15px" }}
                    />
                    {video.grade}/10 ({video.reviews_count} reviews)
                    <IconButton
                      sx={{ mr: "30px", fontSize: "12px" }}
                      onClick={() => {
                        handleVideoDelete(video.title);
                      }}
                    >
                      <Delete />
                      Delete
                    </IconButton>
                  </Box>
                </Grid2>
              ) : null
            )}
          </Grid2>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default AdminAccordion;
