export type UserType = {
  username: string;
  userToken: string | null;
  isSigningIn: boolean;
  error: boolean | null;
  success: boolean;
};

export type UserState = {
  user: UserType;
};

export type UserCredentials =
  | {
      username: string;
      password: string;
    }
  | {
      username: string;
      token: string;
    };
