//require("dotenv").config(); // load .env variables
import { Router } from "express"; // import router from express
import { getReviewByShow, getAllReviews, getReviewsByUser, addComment } from "./Review.js";

const ReviewsRouter = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
// const { SECRET = "secret" } = process.env;

ReviewsRouter.get("/all", async (req, res) => {
	try {
		await getAllReviews((reviews) => {
			res.status(200).json({ result: "success", data: reviews });
		});
	} catch (error) {
		res.status(400).json({ error });
	}
});

ReviewsRouter.get("/:showId", async (req, res) => {
	const show_id = req.params.showId;
	console.log(show_id);
	try {
		await getReviewByShow(show_id, (reviews) => {
			res.status(200).json({ result: "success", reviews: [...reviews] });
		});
	} catch (error) {
		res.status(400).json({ error });
	}
});

ReviewsRouter.get("/userReviews/:username", async (req, res) => {
	try {
		const username = req.params.username;
		await getReviewsByUser(username, (userReviews) => {
			res.status(200).json({ result: "SUCCESS", data: userReviews });
		});
	} catch (error) {
		res.status(400).json({ error });
	}
});

ReviewsRouter.post("/userReviews/addComment", async (req, res) => {
	const data = {
		comment: req.body.comment,
		show_id: req.body.show_id,
		username: req.body.username,
	};
	try {
		await addComment(data, () => {
			res.status(200).json({ result: "SUCCESS" });
		});
	} catch (error) {
		res.status(500).json({ result: "error", error: error });
	}
});

export default ReviewsRouter;
