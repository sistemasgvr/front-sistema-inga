"use client";

import { useImpresion } from "../hooks/use-impresion";
import { EstadoImpresionPunto } from "./estado-impresion-punto";

export function PanelImpresion() {
  const { activo, estaciones, estado, configurar, reanudar } = useImpresion();
  function detener() {
    if (window.confirm('Esta PC dejará de imprimir comandas de todas las estaciones. ¿Continuar?')) configurar([]);
  }
  return <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white">Impresión de comandas en esta PC</h2>
        <p role="status" className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <EstadoImpresionPunto nivel={estado.nivel} />
          {activo ? `${estado.mensaje} · ${estaciones.length} estación(es)` : estado.mensaje}
        </p>
      </div>
      <div className="flex gap-2">
        {estado.nivel === 'pausado' && <button type="button" onClick={reanudar}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">Reanudar</button>}
        {activo && <button type="button" onClick={detener}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
          Dejar de imprimir aquí</button>}
      </div>
    </div>
    <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-xs text-gray-500">
      <li>Instala y abre <strong>QZ Tray</strong> en esta PC (autoriza el sitio si lo pide).</li>
      <li>En cada estación usa «Probar conexión» o «Imprimir hoja de prueba» para verificar la impresora (ESC/POS por IP, puerto 9100).</li>
      <li>Marca «Imprimir comandas en esta PC» en las estaciones que atenderá este equipo: empieza a imprimir al instante.</li>
      <li>Mantén esta web abierta (en cualquier página) y la PC encendida. La selección se guarda en este navegador.</li>
    </ol>
  </div>;
}
