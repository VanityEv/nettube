import { createSlice } from "@reduxjs/toolkit";
import { userLogin } from "./user-actions";

type UserType = {
  username: string;
  userToken: string | null;
  loading: boolean;
  error: boolean | null;
  success: boolean;
};

const initialState: UserType = {
  loading: false,
  userToken: null,
  error: null,
  success: false,
  username: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.username = action.payload.username;
      state.userToken = action.payload.token;
    },
  },
});

export default userSlice;
export const userActions = userSlice.actions;
