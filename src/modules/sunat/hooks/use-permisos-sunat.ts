"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export interface PermisosSunat {
  /** Ver estados, bandeja, resumen del día y descargar XML/CDR/PDF A4. */
  listar: boolean;
  /** Ver la configuración en Empresa. */
  verConfiguracion: boolean;
  /** Cambiar token, ambiente, SOL, certificado y plazos. */
  editarConfiguracion: boolean;
  /** Enviar a SUNAT (individual o masivo) y consultar CDR/tickets. */
  enviar: boolean;
  /** Dar de baja en SUNAT un comprobante aceptado. */
  darDeBaja: boolean;
}

const NINGUNO: PermisosSunat = {
  listar: false,
  verConfiguracion: false,
  editarConfiguracion: false,
  enviar: false,
  darDeBaja: false,
};

/** Cada botón SUNAT se muestra solo si el usuario tiene el permiso de esa acción. */
export function usePermisosSunat() {
  const [permisos, setPermisos] = useState<PermisosSunat>(NINGUNO);

  useEffect(() => {
    const user = getStoredUser();
    const tiene = (p: string) => Boolean(user?.es_super_admin || user?.permisos?.includes(p));
    queueMicrotask(() =>
      setPermisos({
        listar: tiene(PermisoBanderas.SUNAT_LISTAR),
        verConfiguracion: tiene(PermisoBanderas.SUNAT_VER),
        editarConfiguracion: tiene(PermisoBanderas.SUNAT_EDITAR),
        enviar: tiene(PermisoBanderas.SUNAT_CREAR),
        darDeBaja: tiene(PermisoBanderas.SUNAT_ELIMINAR),
      }),
    );
  }, []);

  return permisos;
}
