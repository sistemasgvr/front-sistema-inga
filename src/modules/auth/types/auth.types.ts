export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type LoginSuccess = {
  ok: true;
  user: AuthUser;
  /** Placeholder until real API tokens arrive */
  accessToken: string;
};

export type LoginFailure = {
  ok: false;
  message: string;
};

export type LoginResult = LoginSuccess | LoginFailure;

export type LoginFormErrors = {
  email?: string;
  password?: string;
  form?: string;
};
