import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { TestCardProps } from '../pages/HomePage';
import Favorite from '@mui/icons-material/Favorite'
import IconButton from '@mui/material/IconButton';
import TransitionsModal from './TransitionsModal';


export default function MediaCard({title,alt,description,thumbnail}: TestCardProps) {
//Dalej nie mam pojęcia jak przekazać te pola z MediaCard do TransitionsModal
  const TestProps: TestCardProps = {
    title: "test",
    alt: "test",
    description: "test",
    thumbnail: "https://i.ytimg.com/vi/d_rbdAawZZg/maxresdefault.jpg"
  }

  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardMedia
        component="img"
        height="100"
        image={thumbnail}
        alt={alt}
        sx={{objectFit: "contain"}}
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
        <IconButton aria-label="play">
          <TransitionsModal {...TestProps}/>
        </IconButton>
      </CardActions>
    </Card>
  );
}