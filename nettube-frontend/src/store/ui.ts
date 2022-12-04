import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UiState = {
	searchValue: string;
};

const initialState: UiState = {
	searchValue: "",
};

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		onChangeSearchValue(state, action: PayloadAction<string>) {
			state.searchValue = action.payload;
		},
	},
});

export const uiActions = uiSlice.actions;
export default uiSlice;
