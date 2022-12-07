import { configureStore } from "@reduxjs/toolkit";
import reviewSlice from "./reviews";
import uiSlice from "./ui";
import videosSlice from "./videos";

const store = configureStore({
	reducer: { ui: uiSlice.reducer, videos: videosSlice.reducer, reviews: reviewSlice.reducer },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
