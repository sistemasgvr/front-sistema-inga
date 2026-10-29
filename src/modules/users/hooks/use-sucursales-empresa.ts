"use client";

import { useEffect, useState } from "react";
import { listSucursales } from "@/modules/sucursales/services/sucursales.service";
import type { SucursalOption } from "../types/user.types";

/** Sucursales activas de la empresa de la sesión (el backend filtra por empresa). */
export function useSucursalesEmpresa(enabled: boolean) {
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let vigente = true;
    queueMicrotask(() => { setCargando(true); setError(null); });
    listSucursales({ pagina: 1, limite: 100, estado: "activos" })
      .then((r) => { if (vigente) setSucursales(r.registros.map((s) => ({ id: s.id, nombre: s.nombre }))); })
      .catch((e: unknown) => { if (vigente) setError(e instanceof Error ? e.message : "No se pudieron cargar las sucursales."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [enabled]);

  return { sucursales, cargando, error };
}
