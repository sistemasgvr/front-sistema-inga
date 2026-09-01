"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredToken, getMe, AUTH_STORAGE_KEY } from "../services/auth.service";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function backgroundVerify() {
      const token = getStoredToken();
      
      // Si no hay token, fuera de inmediato
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // Verificación silenciosa en segundo plano
        const user = await getMe();
        
        // Si el backend responde que no hay usuario o está inactivo
        if (!user) {
          throw new Error("Sesión inválida");
        }
      } catch (error) {
        // Si falla la validación por detrás, limpiamos y botamos al login
        localStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        router.replace("/login");
      }
    }

    void backgroundVerify();
  }, [pathname, router]);

  // Renderizamos los hijos de inmediato sin bloquear ni mostrar pantallas en blanco
  return <>{children}</>;
}