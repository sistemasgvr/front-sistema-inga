"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useImpresion } from "../hooks/use-impresion";
import { EstadoImpresionPunto } from "./estado-impresion-punto";

export function PanelImpresion() {
  const { activo, estaciones, estado, configurar, reanudar } = useImpresion();
  const [ayuda, setAyuda] = useState(false);
  function detener() {
    if (window.confirm('Esta PC dejará de imprimir comandas de todas las estaciones. ¿Continuar?')) configurar([]);
  }
  return <section className="mb-5 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <Icon name="mdi:printer-pos-outline" size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Impresión de comandas en esta PC</p>
          <p role="status" className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <EstadoImpresionPunto nivel={estado.nivel} />
            {activo ? `${estado.mensaje} · ${estaciones.length} estación(es)` : estado.mensaje}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setAyuda(v => !v)} aria-expanded={ayuda}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
          <Icon name="mdi:help-circle-outline" size={16} />¿Cómo funciona?
        </button>
        {estado.nivel === 'pausado' && <button type="button" onClick={reanudar}
          className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600">Reanudar</button>}
        {activo && <button type="button" onClick={detener}
          className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]">
          Dejar de imprimir aquí</button>}
      </div>
    </div>
    {ayuda && <ol className="mt-3 list-decimal space-y-1 border-t border-gray-100 pt-3 pl-5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
      <li>Instala y abre <strong>QZ Tray</strong> en esta PC (autoriza el sitio si lo pide).</li>
      <li>Verifica la impresora desde el menú <strong>⋮</strong> de la estación: «Probar conexión» o «Imprimir hoja de prueba» (ESC/POS por IP, puerto 9100).</li>
      <li>Activa <strong>«Imprimir aquí»</strong> en las estaciones que atenderá este equipo: empieza a imprimir al instante.</li>
      <li>Mantén esta web abierta (en cualquier página) y la PC encendida. La selección se guarda en este navegador.</li>
    </ol>}
  </section>;
}
