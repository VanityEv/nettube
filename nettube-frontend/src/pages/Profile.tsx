import { Box } from "@mui/material";
import ProfileCard, { ProfileInfo } from "../components/ProfileCard";
import UserProfileAccordion from "../components/UserProfileAccordion";
import useHttp from "../hooks/useHttp";
import { useEffect, useState } from "react";

function Profile() {
  const { sendRequest } = useHttp();
  const [userData, setData] = useState({
    username: "",
    fullname: "",
    email: "",
    birthdate: "",
    subscription: 0,
  });

  const fetchUserProfileInfo = async () => {
    const response = await sendRequest({
      method: "POST",
      body: {
        username: localStorage.getItem("username"),
      },
      endpoint: "/user/getUserData",
    });
    if (response.result === "SUCCESS") {
      setData(response);
    }
  };

  const sendUpdateQuery = async (param: string, value: string) => {
    const response = await sendRequest({
      method: "POST",
      body: {
        param: param,
        value: value,
        username: localStorage.getItem("username"),
      },
      endpoint: "/user/updateUser",
    });
    if (response === "SUCCESS") {
      fetchUserProfileInfo();
    }
  };

  useEffect(() => {
    fetchUserProfileInfo();
  }, []);

  const userProfileInfo: ProfileInfo = {
    uname: userData.username,
    fullname: userData.fullname,
    email: userData.email,
    birthdate: userData.birthdate,
    subscriptiontype: userData.subscription,
    confirmChange: sendUpdateQuery,
  };
  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <ProfileCard {...userProfileInfo} />
        <UserProfileAccordion />
      </Box>
    </>
  );
}
export default Profile;
