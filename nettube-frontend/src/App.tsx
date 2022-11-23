import './App.css';
import MediaCard from './components/MediaCard'
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import ResponsiveAppBar from './components/ResponsiveAppBar';
import SearchBar from './components/SearchBar';
import Carousel from './components/Carousel';

export type TestCardProps = {
  title: string,
  alt: string,
  description: string,
  thumbnail: string
}

export type SelectedVideos = {
  videos: Array<string>;
} 

const TestCard: TestCardProps = {
  title: "Testowy",
  alt: "alter",
  thumbnail: "bleach.png",
  description: "testowy description"
}
const TestCard2: TestCardProps = {
  title: "Testowy2",
  alt: "alter2",
  thumbnail: "",
  description: "testowy description2"
}

const images: SelectedVideos = {
  videos:  ['https://placeimg.com/640/480/animals', 'https://placeimg.com/640/480/nature', 'https://placeimg.com/640/480/architecture']
}
const videos = ['https://placeimg.com/640/480/animals', 'https://placeimg.com/640/480/nature', 'https://placeimg.com/640/480/architecture'];

function App() {

  return (
    <><nav>
      <ResponsiveAppBar />
    </nav><div className='wrapping'>
      <SearchBar/>
      <Carousel {...images}/>
        <Grid2 container spacing={2}>
          <Grid2 xs={3}>
            <MediaCard {...TestCard} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard2} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard2} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard2} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard2} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard2} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard2} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard2} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard} />
          </Grid2>
          <Grid2 xs={3}>
            <MediaCard {...TestCard2} />
          </Grid2>
        </Grid2>
      </div></>
  );
}

export default App;
