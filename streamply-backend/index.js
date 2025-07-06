import express from 'express';
import cors from 'cors';
import UserRouter from './services/user/UserRouter.js';
import VideosRouter from './services/video/VideoRouter.js';
import ReviewRouter from './services/review/ReviewRouter.js';
import bodyParser from 'body-parser';
import { logAttack } from './middleware/logAttack.js';
import { logSecurityEvent, getRecentSecurityEvents } from './services/security/mongoLogger.js';

const app = express();
const port = process.env.PORT || 3001; // Use Heroku's PORT or default to 3001

app.use(cors());
app.use(bodyParser.json());
app.use(logAttack);

app.use('/user', UserRouter);
app.use('/videos', VideosRouter);
app.use('/reviews', ReviewRouter);
app.use('/movies', express.static('movies'));
app.use('/images', express.static('images'));

// Monitoring dashboard endpoint (admin only, should be protected in production)
app.get('/admin/security-dashboard', async (req, res) => {
  // TODO: Add admin authentication/authorization
  const events = await getRecentSecurityEvents();
  res.status(200).json({ events });
});

// Example: log server start event
logSecurityEvent({ type: 'server_start', message: `Server started on port ${port}` });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
