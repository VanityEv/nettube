//require("dotenv").config(); // load .env variables
import { Router } from "express"; // import router from express
import { getAllVideos, getOneVideo, getVideosByGenre } from "./Video.js";

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

export default VideosRouter;
