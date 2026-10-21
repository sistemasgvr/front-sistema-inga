"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

const PREFIJO = "filtros:";

function leer<T>(clave: string, inicial: T): T {
  if (typeof window === "undefined") return inicial;
  try {
    const raw = sessionStorage.getItem(PREFIJO + clave);
    return raw === null ? inicial : (JSON.parse(raw) as T);
  } catch {
    return inicial;
  }
}

/**
 * useState que sobrevive a F5: guarda filtros, búsqueda y página en
 * sessionStorage (por pestaña). Se lee al montar, así que la pantalla debe
 * renderizarse solo en el cliente (las rutas van dentro de RoleGuard).
 */
export function useEstadoPersistente<T>(
  clave: string,
  inicial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [valor, setValor] = useState<T>(() => leer(clave, inicial));

  useEffect(() => {
    try {
      if (valor === undefined) sessionStorage.removeItem(PREFIJO + clave);
      else sessionStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    } catch {
      // Sin almacenamiento (modo privado): el filtro solo vive en memoria.
    }
  }, [clave, valor]);

  return [valor, setValor];
}

/**
 * Vuelve a la página 1 cuando cambia la búsqueda, pero no al montar: así un F5
 * conserva la página guardada y no se pide el listado dos veces.
 */
export function useReiniciarPagina(dependencia: unknown, setPagina: (pagina: number) => void) {
  const clave = JSON.stringify(dependencia ?? null);
  const previa = useRef(clave);

  useEffect(() => {
    if (clave === previa.current) return;
    previa.current = clave;
    setPagina(1);
  }, [clave, setPagina]);
}

/** Al cerrar sesión, el siguiente usuario no hereda los filtros. */
export function limpiarEstadosPersistentes() {
  if (typeof window === "undefined") return;
  try {
    Object.keys(sessionStorage)
      .filter((clave) => clave.startsWith(PREFIJO))
      .forEach((clave) => sessionStorage.removeItem(clave));
  } catch {
    // Nada que limpiar.
  }
}
