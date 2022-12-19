import { SERVER_ADDR, SERVER_PORT } from "../constants";
import { AppDispatch } from ".";
import { UserCredentials } from "./user.types";
import { userActions } from "./user";

export const userLogin = (userCredentials: UserCredentials) => {
  return async (dispatch: AppDispatch) => {
    const fetchUser = async () => {
      const response = await fetch(
        SERVER_ADDR + ":" + SERVER_PORT + "/user/signin",
        {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          credentials: "same-origin", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: userCredentials.username,
            password: userCredentials.password,
          }),
        }
      );
      return await response.json();
    };
    try {
      const response = await fetchUser();
      const username = response.username;
      const password = response.password;
      const userToken = response.token;
      localStorage.setItem("userToken", userToken);
      localStorage.setItem("username", username);
      dispatch(
        userActions.setUser({
          username,
          password,
          token: userToken,
        })
      );
    } catch (error) {
      // dispatch(
      // 	uiActions.showNotification({
      // 		status: "error",
      // 		title: "Error!",
      // 		message: "Fetching cart data failed!",
      // 	})
      // );
    }
  };
};
