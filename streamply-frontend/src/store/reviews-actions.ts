import { SERVER_ADDR, SERVER_PORT } from "../constants";
import { reviewsActions } from "./reviews";
import { AppDispatch } from ".";

export const fetchReviewsData = () => {
  return async (dispatch: AppDispatch) => {
    const fetchReviews = async () => {
      const response = await fetch(
        SERVER_ADDR + ":" + SERVER_PORT + "/reviews/all",
        {
          method: "GET", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          credentials: "same-origin", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return await response.json();
    };
    try {
      const response = await fetchReviews();
      const reviewsData = response.data;
      dispatch(
        reviewsActions.setReviews({
          reviews: reviewsData,
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
