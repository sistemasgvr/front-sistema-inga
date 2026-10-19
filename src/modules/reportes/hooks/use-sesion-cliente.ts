"use client";

import { useSyncExternalStore } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";

const sinCambios = () => () => {};

/**
 * Lee un dato de la sesión guardada en el navegador sin romper la hidratación.
 *
 * La sesión vive en localStorage, que no existe en el servidor: si se lee
 * durante el render, el HTML del servidor ("sin permiso") no coincide con el
 * del navegador ("con permiso") y React lanza "Hydration failed". Con
 * useSyncExternalStore el primer render del navegador usa el mismo valor que el
 * servidor (`enServidor`) y justo después pasa al valor real.
 *
 * `leer` debe devolver un valor primitivo para que React lo compare por valor.
 */
export function useSesionCliente<T extends string | number | boolean | null>(leer: () => T, enServidor: T): T {
  return useSyncExternalStore(sinCambios, leer, () => enServidor);
}

/** true/false según el permiso; null mientras no se sabe (servidor e hidratación). */
export function useTienePermiso(permiso: string): boolean | null {
  return useSesionCliente(() => {
    const user = getStoredUser();
    return Boolean(user?.es_super_admin || user?.permisos?.includes(permiso));
  }, null);
}
