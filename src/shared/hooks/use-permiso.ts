"use client";

import { useSyncExternalStore } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";

const sinSuscripcion = () => () => {};

/**
 * Permiso del usuario para decidir qué se pinta.
 *
 * Usa el mismo mecanismo que `RoleGuard` (`useSyncExternalStore`): la sesión
 * vive en localStorage, así que en el servidor devuelve `false` y la
 * hidratación no se rompe. Sirve para vistas que mezclan secciones con permisos
 * distintos, como Ventas y SUNAT en una sola pantalla.
 */
export function useTienePermiso(permiso: string | string[]): boolean {
  const requeridos = [permiso].flat();

  return useSyncExternalStore(
    sinSuscripcion,
    () => {
      const user = getStoredUser();
      const permisos = user?.permisos ?? [];
      const isSuper = Boolean(
        user?.es_super_admin || user?.sesion?.es_super_admin,
      );
      return isSuper || requeridos.some((p) => permisos.includes(p));
    },
    () => false,
  );
}
