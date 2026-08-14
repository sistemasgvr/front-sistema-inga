export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  id_sucursal_default?: number | null;
  permisos: string[];
};

export type LoginSuccess = {
  ok: true;
  user: AuthUser;
  token: string;
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