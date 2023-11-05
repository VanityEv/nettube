import { createSlice } from "@reduxjs/toolkit";
import type { ReviewState } from "./reviews.types";

const initialState: ReviewState = {
	reviews: [],
};

const reviewSlice = createSlice({
	name: "reviews",
	initialState,
	reducers: {
		setReviews(state, action) {
			state.reviews = action.payload.reviews;
		},
	},
});

export const reviewsActions = reviewSlice.actions;
export default reviewSlice;
