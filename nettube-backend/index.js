import express from "express";
import cors from "cors";
import config from "./config/config.js";
import UserRouter from "./services/user/UserRouter.js";
import VideosRouter from "./services/video/VideoRouter.js";
import ReviewRouter from "./services/review/ReviewRouter.js";
import bodyParser from "body-parser";

const app = express();
const port = config.server.port;

app.use(cors());
app.use(bodyParser.json());

app.use("/user", UserRouter);
app.use("/videos", VideosRouter);
app.use("/reviews", ReviewRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
