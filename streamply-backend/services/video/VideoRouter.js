//require("dotenv").config(); // load .env variables
import { Router } from 'express'; // import router from express
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllVideos,
  getOneVideo,
  getVideosByGenre,
  deleteVideo,
  addVideo,
  getPopularMovies,
  getPopularSeries,
  addEpisode,
  getEpisodes,
  getRecommendations,
  getProgressedVideos,
  getProgress,
  setProgressMovie,
  setProgressSeries,
  updateMovieProgress,
  updateSeriesProgress,
  deleteProgressedVideo,
  getShowLength
} from './Video.js';
import Ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import multer from 'multer';
import { toKebabCase } from '../../helpers/toKebabCase.js';
import { ensureFolderExists } from '../../helpers/ensureFolderExists.js';
import { verifyAdmin, verifyToken } from '../../helpers/verifyToken.js';
import fs from 'fs';

Ffmpeg.setFfmpegPath(ffmpegInstaller.path);
Ffmpeg.setFfprobePath(ffprobeInstaller.path);

const VideosRouter = Router(); // create router to create route bundle

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Multer configuration for this router
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const show_title = req.body.show_title || req.body.title;
    const season = req.body.season;
    const kebabCaseFilename = toKebabCase(show_title);

    if (file.fieldname === 'video' || file.fieldname === 'episode_file') {
      let userFolderPath;
      if (!season) {
        userFolderPath = path.join(__dirname, '../..', 'movies', kebabCaseFilename);
      } else {
        userFolderPath = path.join(__dirname, '../..', 'movies', kebabCaseFilename, `season-${season}`);
      }
      ensureFolderExists(userFolderPath);
      cb(null, userFolderPath);
    } else if (file.fieldname === 'thumbnail') {
      const thumbnailFolderPath = path.join(__dirname, '../..', 'images', 'thumbnails', kebabCaseFilename);
      ensureFolderExists(thumbnailFolderPath);
      cb(null, thumbnailFolderPath);
    } else {
      cb(new Error('Invalid fieldname'), null);
    }
  },
  filename: function (req, file, cb) {
    const title = req.body.title;
    const fileName = toKebabCase(title);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `${fileName}${file.fieldname === 'video' ? '' : '-thumbnail'}${fileExtension}`);
  },
});

const upload = multer({ storage: storage });

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
// const { SECRET = "secret" } = process.env;

VideosRouter.post(
  '/upload/movie',
  verifyToken,
  verifyAdmin,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const { title } = req.body;
      const videoFile = req.files['video'][0];
      const thumbnailFile = req.files['thumbnail'][0];

      // Rename the file to kebab case
      const kebabCaseFilename = toKebabCase(title);
      const thumbnailExtension = path.extname(thumbnailFile.originalname);

      const inputFilePath = path.resolve(`movies/${kebabCaseFilename}/${videoFile.filename}`);
      const outputFilePath = path.resolve(`movies/${kebabCaseFilename}/${kebabCaseFilename}.m3u8`);
      //Create HLS manifest and create 10s segments from input
      Ffmpeg()
        .input(inputFilePath)
        .inputFormat('mp4')
        .addOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls',
        ])
        .output(outputFilePath)
        .on('end', async () => {
          console.log(`${kebabCaseFilename} - video transcoding completed.`);
          Ffmpeg.ffprobe(inputFilePath, async (err, metadata) => {
            if (err) {
              res.status(422).json({ result: 'ERROR' });
            } else {
              const videoDuration = Math.round(metadata.format.duration / 60);
              //delete mp4 file
              fs.unlinkSync(inputFilePath);
              await addVideo(req.body, videoDuration, thumbnailExtension, async response => {
                const status = response.affectedRows === 1;
                status ? res.status(200).json({ result: 'SUCCESS' }) : res.status(500).json({ result: 'ERROR' });
              });
            }
          });
        })
        .run();
    } catch (error) {
      res.status(500).json({ result: 'ERROR', message: 'Error processing the video.' });
    }
  }
);

VideosRouter.post('/upload/episode', verifyToken, verifyAdmin, upload.single('episode_file'), (req, res) => {
  try {
    const videoFile = req.file;
    const { season, episode, show_title } = req.body;

    // Rename the file to kebab case
    const kebabCaseFilename = toKebabCase(show_title);
    const inputFilePath = path.resolve(`movies/${kebabCaseFilename}/season-${season}/${videoFile.filename}`);
    const outputFilePath = path.resolve(
      `movies/${kebabCaseFilename}/season-${season}/${kebabCaseFilename}-s${season}e${episode}.m3u8`
    );
    const thumbnailFilePath = path.resolve(
      `images/thumbnails/${kebabCaseFilename}/${kebabCaseFilename}-s${season}e${episode}-thumbnail.jpg`
    );
    //ensure destination folder exists for video
    ensureFolderExists(`../../movies/${kebabCaseFilename}/season-${season}`);
    //ensure destination folder exists for thumbnail
    ensureFolderExists(path.resolve(`images/thumbnails/${kebabCaseFilename}`));
    // Perform video transcoding
    Ffmpeg()
      .input(inputFilePath)
      .inputFormat('mp4')
      .addOptions([
        '-profile:v baseline',
        '-level 3.0',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls',
      ])
      .output(outputFilePath)
      .on('end', async () => {
        console.log(`${kebabCaseFilename} - video transcoding completed.`);
        await addEpisode(req.body, async response => {
          const status = response.affectedRows === 1;
          status ? res.status(200).json({ result: 'success' }) : res.status(500).json({ error: 'error' });
        });

        // Generate Thumbnail
        Ffmpeg()
          .input(inputFilePath)
          .seekInput(10) // Seek to the 10-second mark
          .frames(1) // Capture a single frame
          .output(thumbnailFilePath)
          .on('end', () => {
            console.log(`${kebabCaseFilename} - thumbnail generation completed.`);
          })
          .on('error', (err, stdout, stderr) => {
            console.log('Error generating thumbnail:');
            console.log(err.message);
            console.log('stdout:\n' + stdout);
            console.log('stderr:\n' + stderr);
          })
          .run();
      })
      .on('error', (err, stdout, stderr) => {
        console.log('Error transcoding video:');
        console.log(err.message);
        console.log('stdout:\n' + stdout);
        console.log('stderr:\n' + stderr);
      })
      .run();
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: 'ERROR', message: 'Error processing the video.' });
  }
});

VideosRouter.get('/episodes/:id', async (req, res) => {
  const show_id = req.params.id;

  try {
    await getEpisodes(show_id, async episodes => {
      // Add the thumbnail field to each episode
      const episodesWithThumbnail = episodes.map(episode => ({
        ...episode,
        thumbnail: `http://localhost:3001/images/thumbnails/${toKebabCase(episode.show_name)}/${toKebabCase(
          episode.show_name
        )}-s${episode.season}e${episode.episode}-thumbnail.jpg`,
      }));

      res.status(200).json({ result: 'SUCCESS', episodes: episodesWithThumbnail });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.post('/recommendations/:username', verifyToken, async (req, res) => {
  const { username } = req.params;
  const { genres } = req.body;

  try {
    await getRecommendations(username, genres, async result => {
      res.status(200).json({ result: 'SUCCESS', recommendations: result });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: 'ERROR', error: 'Internal Server Error' });
  }
});

VideosRouter.get('/getProgressed/:username', verifyToken, async (req, res) => {
  const { username } = req.params;
  try {
    await getProgressedVideos(username, async result => {
      res.status(200).json({ result: 'SUCCESS', progressedVideos: result });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: 'ERROR', error: 'Internal Server Error' });
  }
});

VideosRouter.post('/setProgress/:username', verifyToken, async (req, res) => {
  const { username } = req.params;
  const { season, episode, showID, timeWatched } = req.body;
  try {
    await getShowLength(showID, async result => {
      //get video duration in seconds
      const videoLength = result[0].video_length * 60;
      if(videoLength - 10 < timeWatched) {
        await deleteProgressedVideo(showID, username, async result => {
          res.status(200).json({ result: 'SUCCESS' });
        })
      }
      else {
        await getProgress(showID, username, async result => {
          if (!result || !result[0]) {
            if (!season && !episode) {
              await setProgressMovie(username, showID, timeWatched, async result => {
                res.status(201).json({ result: 'SUCCESS' });
              });
            } else {
              await setProgressSeries(username, showID, season, episode, timeWatched, async result => {
                res.status(201).json({ result: 'SUCCESS' });
              });
            }
          } else {
            if (!season && !episode) {
              await updateMovieProgress(username, showID, timeWatched, async result => {
                res.status(201).json({ result: 'SUCCESS' });
              });
            }
            else {
              await updateSeriesProgress(username, showID, timeWatched, season, episode, async result => {
                res.status(201).json({ result: 'SUCCESS' });
              });
            }
          }
        });
      }
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: 'ERROR', error: 'Internal Server Error' });
  }
});

VideosRouter.post('/deleteProgressedVideo/:username', verifyToken, async (req,res) => {
  const {showID, username} = req.body;
  try {
    await deleteProgressedVideo(showID, username, async response => {
      const status = response.affectedRows === 1;
      status ? res.status(200).json({ result: 'SUCCESS' }) : res.status(500).json({ error: 'ERROR' });
    })
  }
  catch(error) {
    console.error(error);
    res.status(500).json({ result: 'ERROR', error: 'Internal Server Error' });
  }
})

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
      res.status(200).json({ result: 'SUCCESS', data: videos });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.post('/deleteVideo', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await deleteVideo(req.body.title, async response => {
      const status = response.affectedRows === 1;
      status ? res.status(200).json({ result: 'SUCCESS' }) : res.status(500).json({ error: 'ERROR' });
    });
  } catch (error) {
    res.status(400).json({ error: 'ERROR' });
  }
});

VideosRouter.get('/top-movies', async (req, res) => {
  try {
    await getPopularMovies(videos => {
      res.status(200).json({ result: 'SUCCESS', data: videos });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

VideosRouter.get('/top-series', async (req, res) => {
  try {
    await getPopularSeries(videos => {
      res.status(200).json({ result: 'SUCCESS', data: videos });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default VideosRouter;
