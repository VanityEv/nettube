import { createSlice } from '@reduxjs/toolkit';
import { UserType } from './user.types';

const initialState: UserType = {
  isSigningIn: false,
  userToken: null,
  error: null,
  success: false,
  username: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    //Sign in
    setUser(state, action) {
      state.username = action.payload.username;
      state.userToken = action.payload.token;
      state.isSigningIn = false;
    },
    setIsSigning(state) {
      state.isSigningIn = true;
    },
  },
});

export default userSlice;
export const userActions = userSlice.actions;
