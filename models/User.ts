import { PERMISSION, AUTH_METHOD } from "@common/enum";

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: Maybe<string>;
  password_hash: string;
  info: Maybe<string>;
  avatar: Maybe<string>;
  permission: PERMISSION;
  method: AUTH_METHOD;
  salt: string;
}

export type CreateUserPayload = Pick<
  User,
  "name" | "email" | "mobile" | "info" | "avatar"
> & {
  password: string;
};

export type LoginPayload = Pick<User, "email"> & {
  password: string;
};

export interface ILoginSocial {
  accessToken: string;
  method: AUTH_METHOD;
}
