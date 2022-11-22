import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { TestCardProps } from '../App';
import Favorite from '@mui/icons-material/Favorite'
import IconButton from '@mui/material/IconButton';
import { PlayCircle } from '@mui/icons-material';


export default function MediaCard({title,alt,description,thumbnail}: TestCardProps) {
  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardMedia
        component="img"
        height="100"
        image={thumbnail}
        alt={alt}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" >
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton aria-label="add to favorites">
          <Favorite />
        </IconButton>
        <IconButton aria-label="share">
          <PlayCircle />
        </IconButton>
      </CardActions>
    </Card>
  );
}