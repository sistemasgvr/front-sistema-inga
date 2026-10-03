"use client";

import Link from "next/link";
import { useImpresion } from "../hooks/use-impresion";
import { EstadoImpresionPunto } from "./estado-impresion-punto";

// Visible en toda la app mientras esta PC imprime comandas; lleva a Estaciones para revisar.
export function IndicadorImpresion() {
  const { activo, estado } = useImpresion();
  if (!activo) return null;
  return <Link href="/estaciones" title={`Impresión: ${estado.mensaje}`}
    className="flex h-11 items-center gap-2 rounded-full border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
    <EstadoImpresionPunto nivel={estado.nivel} />
    <span className="hidden sm:inline">{estado.nivel === 'pausado' ? 'Impresión pausada' : estado.nivel === 'error' ? 'Impresión sin conexión' : 'Imprimiendo'}</span>
  </Link>;
}
