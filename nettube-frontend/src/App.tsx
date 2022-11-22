import './App.css';
import MediaCard from './components/MediaCard'
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import ResponsiveAppBar from './components/ResponsiveAppBar';
import SearchBar from './components/SearchBar';
import Carousel from './components/Carousel';


export interface TestCardProps {
  title: string,
  alt: string,
  description: string,
  thumbnail: string
}
export interface SelectedVideos {
  vid1src: string,
  vid2src: string,
  vid3src: string,
  vid4src: string,
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
//
const TestCarousel: SelectedVideos = {
  vid1src: "path",
  vid2src: "path2",
  vid3src: "path3",
  vid4src: "path4",
}
function App() {

  return (
    <><nav>
      <ResponsiveAppBar />
    </nav><div className='wrapping'>
      <SearchBar/>
      <Carousel {...TestCarousel}/>
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
