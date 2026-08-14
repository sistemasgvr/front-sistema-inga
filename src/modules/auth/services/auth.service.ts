import { apiGet, apiPost } from "@/shared/api/api-client";
import type {
  AuthUser,
  LoginCredentials,
  LoginResult,
} from "../types/auth.types";

export const AUTH_TOKEN_KEY = "token";
export const AUTH_USER_KEY = "user";

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
      storage.setItem(AUTH_TOKEN_KEY, data.token);
      storage.setItem(AUTH_USER_KEY, JSON.stringify(data.usuario));
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
  return (
    localStorage.getItem(AUTH_TOKEN_KEY) ??
    sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw =
    localStorage.getItem(AUTH_USER_KEY) ??
    sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    return await apiGet<AuthUser>("/auth/me");
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } catch {
    // Ignorar error si la sesión ya expiró
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_USER_KEY);
      window.location.href = "/login";
    }
  }
}