import { Box } from '@mui/material';
import Carousel from '../components/Carousel';
import { CategoryPreview } from '../components/CategoryPreview/CategoryPreview';
import VideosList from '../components/VideosList';

const links = [
  'https://wallpapercave.com/wp/wp3982534.jpg',
  'https://wallpaperaccess.com/full/5486200.jpg',
  'https://images2.alphacoders.com/879/879599.png',
];

function HomePage() {
  return (
    <>
      <Carousel links={links} />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: 'secondary.400',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CategoryPreview
          title="Lucifer"
          name="Popular this week"
          description="The series revolves around the story of Lucifer Morningstar (Tom Ellis), the DC Universe's version of the Devil, who abandons Hell for Los Angeles where he runs his own nightclub named Lux and becomes a consultant to the Los Angeles Police Department (LAPD). "
          background="https://rare-gallery.com/thumbnail/49713-Lucifer-Morningstar-Tom-EllisLucifer-Morningstar-Tom.jpg"
          videos={[]}
        />
      </Box>
      {/* <VideosList type="all" /> */}
    </>
  );
}

export default HomePage;
