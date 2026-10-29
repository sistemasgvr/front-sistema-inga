import { apiGet, apiPost } from "@/shared/api/api-client";
import { limpiarEstadosPersistentes } from "@/shared/hooks/use-estado-persistente";
import type {
  AuthUser,
  LoginCredentials,
  LoginResult,
} from "../types/auth.types";

export const AUTH_STORAGE_KEY = "auth";

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  try {
    const data = await apiPost<{
      token: string;
      usuario: AuthUser;
    }>("/auth/login", {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (typeof window !== "undefined" && data?.token) {
      const storage = credentials.rememberMe ? localStorage : sessionStorage;
      storage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          token: data.token,
          user: data.usuario,
        }),
      );
    }

    return {
      ok: true,
      user: data.usuario,
      token: data.token,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Credenciales incorrectas o error de servidor.";
    return { ok: false, message };
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw =
    localStorage.getItem(AUTH_STORAGE_KEY) ??
    sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw =
    localStorage.getItem(AUTH_STORAGE_KEY) ??
    sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const me = await apiGet<AuthUser>("/auth/me");
    if (me) guardarUsuario({ id_empresa: me.id_empresa, sucursales: me.sucursales, id_sucursal: me.id_sucursal });
    return me;
  } catch {
    return null;
  }
}

export function getSucursalActiva(user: AuthUser | null = getStoredUser()): number | null {
  return user?.id_sucursal ?? user?.id_sucursal_activa ?? null;
}

function guardarUsuario(cambios: Partial<AuthUser>) {
  if (typeof window === "undefined") return;
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...parsed, user: { ...parsed.user, ...cambios } }));
    } catch {
    }
  }
}

export async function cambiarSucursal(idSucursal: number): Promise<number> {
  const r = await apiPost<{ id_sucursal_activa: number }>("/auth/sucursal", { idSucursal });
  guardarUsuario({ id_sucursal_activa: r.id_sucursal_activa, id_sucursal: r.id_sucursal_activa });
  return r.id_sucursal_activa;
}

export async function logout(): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } catch {
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      limpiarEstadosPersistentes();
      window.location.href = "/login";
    }
  }
}

export async function verifyAccess(requiredPermission?: string): Promise<boolean> {
  try {
    const freshUser = await getMe();

    if (!freshUser) {
      await logout();
      return false;
    }

    if (requiredPermission && freshUser.permisos && !freshUser.permisos.includes(requiredPermission)) {
      await logout();
      return false;
    }

    return true;
  } catch {
    await logout();
    return false;
  }
}