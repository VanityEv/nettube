import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VideosList from "../components/VideosList";

function Genres() {
  const navigate = useNavigate();
  useEffect(() => {
    if (
      localStorage.getItem("username") === null ||
      localStorage.getItem("username") === undefined
    ) {
      navigate("/signin");
    }
  }, []);
  return (
    <>
      <VideosList type="genres" />
    </>
  );
}

export default Genres;
