//require("dotenv").config(); // load .env variables
import { Router } from 'express'; // import router from express
import { getAllVideos, getOneVideo, getVideosByGenre, deleteVideo, addVideo, changeVideoURL } from './Video.js';

const VideosRouter = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
// const { SECRET = "secret" } = process.env;

VideosRouter.get('/genres/:genreName', async (req, res) => {
  const genreName = req.params.genreName;
  try {
    const videos = await getVideosByGenre(genreName);
    res.status(200).json({ result: 'success', videos: [...videos] });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.get('/titles/:title', async (req, res) => {
  const videoTitle = req.params.title;
  try {
    await getOneVideo(videoTitle, video => {
      res.status(200).json({ result: 'success', ...video[0] });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.get('/all', async (req, res) => {
  try {
    await getAllVideos(videos => {
      res.status(200).json(videos);
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.post('/deleteVideo', async (req, res) => {
  try {
    await deleteVideo(req.body.title, async response => {
      const status = response.affectedRows === 1;
      status ? res.status(200).json({ result: 'success' }) : res.status(500).json({ error: 'error' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.post('/addVideo', async (req, res) => {
  try {
    await addVideo(req.body, async response => {
      const status = response.affectedRows === 1;
      status ? res.status(200).json({ result: 'success' }) : res.status(500).json({ error: 'error' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.post('/changeURL', async (req, res) => {
  try {
    await changeVideoURL(req.body.title, req.body.url, async response => {
      const status = response.changedRows === 1;
      status ? res.status(200).json({ result: 'success' }) : res.status(500).json({ error: 'error' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default VideosRouter;
