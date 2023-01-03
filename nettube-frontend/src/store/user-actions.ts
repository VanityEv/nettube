import { SERVER_ADDR, SERVER_PORT } from "../constants";
import { AppDispatch } from ".";
import { UserCredentials } from "./user.types";
import { userActions } from "./user";

export const userLogin = (userCredentials: UserCredentials) => {
	return async (dispatch: AppDispatch) => {
		const fetchUser = async () => {
			const response = await fetch(SERVER_ADDR + ":" + SERVER_PORT + "/user/signin", {
				method: "POST", // *GET, POST, PUT, DELETE, etc.
				mode: "cors", // no-cors, *cors, same-origin
				cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
				credentials: "same-origin", // include, *same-origin, omit
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...userCredentials,
				}),
			});
			if (response.ok) return await response.json();
			else return Promise.reject(response);
		};
		try {
			const response = await fetchUser();
			if (response.result === "SUCCESS") {
				const username = response.username;
				const userToken = response.token;
				localStorage.setItem("userToken", userToken);
				localStorage.setItem("username", username);
				dispatch(
					userActions.setUser({
						username,
						token: userToken,
					})
				);
			}
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
