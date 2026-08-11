import type {
  AuthUser,
  LoginCredentials,
  LoginResult,
} from "../types/auth.types";

/**
 * Mock auth — Fase 1.
 * Replace this implementation with real API calls in Fase 6.
 */
const DEMO_USER = {
  id: "1",
  name: "Administrador Inga",
  email: "admin@inga.com",
  password: "admin123",
  role: "admin",
};

export const AUTH_SESSION_KEY = "inga.auth.session";

export type StoredSession = {
  user: AuthUser;
  accessToken: string;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  await delay(600);

  const email = credentials.email.trim().toLowerCase();
  const password = credentials.password;

  if (!email || !password) {
    return { ok: false, message: "Completa el correo y la contraseña." };
  }

  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return { ok: false, message: "Credenciales incorrectas." };
  }

  const result: LoginResult = {
    ok: true,
    user: {
      id: DEMO_USER.id,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      role: DEMO_USER.role,
    },
    accessToken: "mock-access-token",
  };

  if (typeof window !== "undefined" && result.ok) {
    const storage = credentials.rememberMe ? localStorage : sessionStorage;
    const session: StoredSession = {
      user: result.user,
      accessToken: result.accessToken,
    };
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }

  return result;
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  const raw =
    localStorage.getItem(AUTH_SESSION_KEY) ??
    sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}
