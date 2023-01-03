import Grid2 from "@mui/material/Unstable_Grid2";
import MediaCard from "./MediaCard";
import { useAppSelector } from "../hooks/useRedux";
import useHttp from "../hooks/useHttp";
import { useEffect, useState } from "react";
import { LikeEntry } from "./UserProfileAccordion";

/**
 * TODO: zrobić z VideoList reużywalny komponent do wyświetlania różnych materiałów filmowych w zależności od parametrów lub stanu redux (lepiej parametr)
 */
const VideosList = () => {
  const videos = useAppSelector((state) => state.videos.videos);

  const { sendRequest } = useHttp();

  const [likesData, setLikesData] = useState<LikeEntry[] | []>([]);
  const likeList = async () => {
    const username = localStorage.getItem("username");
    const response = await sendRequest({
      method: "GET",
      endpoint: `/user/userLikes/${username}`,
    });

    if (response.result === "SUCCESS") {
      setLikesData(response.data);
    }
  };
  useEffect(() => {
    likeList();
  }, []);

  const mapLikes = new Map<number, boolean>();
  likesData.forEach((like) => mapLikes.set(like.id, true));

  return (
    <>
      <Grid2 container spacing={2} sx={{ maxWidth: "100%" }}>
        {videos.map((item, key) => (
          <Grid2
            key={key}
            mobile={12}
            desktop={3}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <MediaCard liked={mapLikes.get(item.id)} video={item} />
          </Grid2>
        ))}
      </Grid2>
    </>
  );
};

export default VideosList;
