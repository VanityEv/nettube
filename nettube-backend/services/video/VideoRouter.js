//require("dotenv").config(); // load .env variables
import { Router } from "express"; // import router from express
import {
  getAllVideos,
  getOneVideo,
  getVideosByGenre,
  deleteVideo,
  addVideo,
} from "./Video.js";

const VideosRouter = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
// const { SECRET = "secret" } = process.env;

VideosRouter.get("/genres/:genreName", async (req, res) => {
  const genreName = req.params.genreName;
  try {
    const videos = await getVideosByGenre(genreName);
    res.status(200).json({ result: "success", videos: [...videos] });
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Login route to verify a user and get a token
VideosRouter.get("/titles/:title", async (req, res) => {
  const videoTitle = req.params.title;
  try {
    const video = await getOneVideo(videoTitle);
    res.status(200).json({ result: "success", ...video });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.get("/all", async (req, res) => {
  try {
    await getAllVideos((videos) => {
      res.status(200).json({ result: "success", data: videos });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.post("/deleteVideo", async (req, res) => {
  try {
    await deleteVideo(req.body.title, async (response) => {
      const status = response.affectedRows === 1;
      status
        ? res.status(200).json({ result: "success" })
        : res.status(500).json({ error: "error" });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.post("/addVideo", async (req, res) => {
  try {
    await addVideo(
      req.body.title,
      req.body.type,
      req.body.genre,
      req.body.production_year,
      req.body.production_country,
      req.body.director,
      req.body.age_restriction,
      req.body.tags,
      req.body.descr,
      req.body.thumbnail,
      req.body.alt,
      req.body.tier,
      req.body.link,
      async (response) => {
        const status = response.affectedRows === 1;
        status
          ? res.status(200).json({ result: "success" })
          : res.status(500).json({ error: "error" });
      }
    );
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default VideosRouter;
