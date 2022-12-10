export type User = {
  id: number;
  username: string;
  email: string;
  birthdate: number;
  subscription_type: number;
};

export type UserState = {
  user: User;
};

export type UserCredentials = {
  username: string;
  password: string;
};
