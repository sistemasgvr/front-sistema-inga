"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredToken, comprobarSesion, AUTH_STORAGE_KEY } from "../services/auth.service";

const REINTENTO_MS = 10_000;

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [conSesion, setConSesion] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);

  useEffect(() => {
    let activo = true;
    let reintento: ReturnType<typeof setTimeout> | undefined;

    async function verificar() {
      // Si no hay token, fuera de inmediato y sin mostrar la vista
      if (!getStoredToken()) {
        router.replace("/login");
        return;
      }
      setConSesion(true);

      // Verificación silenciosa en segundo plano
      const estado = await comprobarSesion();
      if (!activo) return;

      setSinConexion(estado === "sin-conexion");
      if (estado === "invalida") {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        router.replace("/login");
      } else if (estado === "sin-conexion") {
        reintento = setTimeout(() => void verificar(), REINTENTO_MS);
      }
    }

    void verificar();

    return () => {
      activo = false;
      clearTimeout(reintento);
    };
  }, [pathname, router]);

  if (!conSesion) return null;

  return (
    <>
      {sinConexion && (
        <div
          role="status"
          className="fixed top-3 left-1/2 z-99999 -translate-x-1/2 rounded-lg border border-warning-500 bg-warning-50 px-4 py-2 text-theme-sm font-medium text-gray-800 shadow-theme-lg"
        >
          Sin conexión con el servidor. Reintentando…
        </div>
      )}
      {children}
    </>
  );
}
