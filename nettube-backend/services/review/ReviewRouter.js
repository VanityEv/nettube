//require("dotenv").config(); // load .env variables
import { Router } from "express"; // import router from express
import { getReviewByShow, getAllReviews, getReviewsByUser } from "./Review.js";

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

ReviewsRouter.get("/:review", async (req, res) => {
  const show_id = req.params.review;
  try {
    const reviews = await getReviewByShow(show_id);
    res.status(200).json({ result: "success", ...reviews });
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

export default ReviewsRouter;
