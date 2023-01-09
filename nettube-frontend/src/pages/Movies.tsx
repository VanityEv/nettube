import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideosList from '../components/VideosList';

function Movies() {
  return (
    <>
      <VideosList type="movies" />
    </>
  );
}

export default Movies;
