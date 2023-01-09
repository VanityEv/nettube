import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideosList from '../components/VideosList';

function Series() {
  return (
    <>
      <VideosList type="series" />
    </>
  );
}

export default Series;
