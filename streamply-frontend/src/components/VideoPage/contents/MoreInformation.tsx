import { Grid, Typography } from '@mui/material';
import { Video } from '../../../store/videos.types';

export const MoreInformation = ({ video }: { video: Video }) => {
  return (
    <Grid container sx={{ '&>div>p': { color: 'white', fontSize: '18px' }, ml: '1rem' }}>
      <Grid item desktop={6} mobile={6}>
        <Typography>Title: {video.title}</Typography>
      </Grid>
      <Grid item desktop={6} mobile={6}>
        <Typography>Director: {video.director}</Typography>
      </Grid>
      <Grid item desktop={6} mobile={6}>
        <Typography>Production year: {video.production_year}</Typography>
      </Grid>
      <Grid item desktop={6} mobile={6}>
        <Typography>Production country: {video.production_country}</Typography>
      </Grid>
      <Grid item desktop={6} mobile={6}>
        <Typography>Genre: {video.genre}</Typography>
      </Grid>
      <Grid item desktop={6} mobile={6}>
        <Typography>Average grade: {video.grade}</Typography>
      </Grid>
      <Grid item desktop={6} mobile={6}>
        <Typography>Reviews count: {video.reviews_count}</Typography>
      </Grid>
    </Grid>
  );
};
