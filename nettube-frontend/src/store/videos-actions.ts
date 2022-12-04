import { SERVER_ADDR, SERVER_PORT } from "../constants";
import { videosActions } from "./videos";
import { AppDispatch } from ".";

export const fetchVideosData = () => {
	return async (dispatch: AppDispatch) => {
		/**
		 * TODO: test fetchVideos
		 */
		const fetchVideos = async () => {
			const response = await fetch(SERVER_ADDR + ":" + SERVER_PORT + "/getAllVideos", {
				method: "GET", // *GET, POST, PUT, DELETE, etc.
				mode: "cors", // no-cors, *cors, same-origin
				cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
				credentials: "same-origin", // include, *same-origin, omit
				headers: {
					"Content-Type": "application/json",
				},
			});
			return await response.json();
		};
		try {
			const videosData = await fetchVideos();
			console.log(videosData);
			dispatch(
				videosActions.setVideos({
					videos: videosData,
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
