"use client";

import { useEffect, useState } from "react";
import { getStoredUser, getSucursalActiva } from "../services/auth.service";
import type { AuthUser, SucursalUsuario } from "../types/auth.types";

export type SucursalActiva = {
  /** Sucursal en la que trabaja la sesión; null mientras se lee la sesión o si no tiene. */
  id: number | null;
  nombre: string | null;
  /** Sucursales permitidas al usuario (todas de su empresa). */
  sucursales: SucursalUsuario[];
  empresa: AuthUser["empresa"];
};

/**
 * Sucursal activa («Trabajando en») y empresa de la sesión. Lo diario usa esta
 * sucursal; el backend la toma de la sesión, así que no se elige en formularios.
 */
export function useSucursalActiva(): SucursalActiva {
  const [estado, setEstado] = useState<SucursalActiva>({
    id: null,
    nombre: null,
    sucursales: [],
    empresa: null,
  });

  useEffect(() => {
    const user = getStoredUser();
    const id = getSucursalActiva(user);
    const sucursales = user?.sucursales ?? [];
    queueMicrotask(() =>
      setEstado({
        id,
        nombre: sucursales.find((s) => s.id === id)?.nombre ?? null,
        sucursales,
        empresa: user?.empresa ?? null,
      }),
    );
  }, []);

  return estado;
}
