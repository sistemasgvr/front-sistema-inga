export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

/** Sucursal en la que puede trabajar el usuario. */
export type SucursalUsuario = {
  id: number;
  codigo: string;
  nombre: string;
  es_predeterminada: boolean;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  id_sucursal_default?: number | null;
  es_super_admin?: boolean;
  /** Roles activos; llegan en el login (no en /auth/me). */
  roles?: { id: number; codigo: string; nombre: string }[];
  permisos: string[];
  /** Empresa del usuario (la de su trabajador). */
  id_empresa?: number | null;
  empresa?: { id: number; ruc: string; razon_social: string } | null;
  /** Sucursales en las que puede trabajar. */
  sucursales?: SucursalUsuario[];
  /** Sucursal activa de la sesión: el login la envía como id_sucursal_activa y /auth/me como id_sucursal. */
  id_sucursal_activa?: number | null;
  id_sucursal?: number | null;
  sesion?: {
    id: number;
    id_usuario: number;
    nombre_usuario: string;
    correo: string;
    nombres?: string;
    apellidos?: string;
    es_super_admin?: boolean;
    estado?: number;
    fecha_inicio: string;
  };
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