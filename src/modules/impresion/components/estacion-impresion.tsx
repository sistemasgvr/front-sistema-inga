"use client";

import type { EstacionItem } from "@/modules/estaciones/types/estaciones.types";
import { useEstacionImpresion } from "../hooks/use-estacion-impresion";

export function EstacionImpresion({ estacion }: { estacion: EstacionItem }) {
  const { busy, message, pendientes, selected, seleccionar, probar, imprimirHojaPrueba, resolver, verCola, cerrarCola } = useEstacionImpresion(estacion);
  const disponible = estacion.estado === 1 && !!estacion.impresora_ip;
  return <div className="mt-3 space-y-2 text-left text-xs">
    <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
      <input type="checkbox" checked={selected} disabled={!selected && !disponible}
        onChange={(event) => seleccionar(event.target.checked)} />
      Imprimir comandas en esta PC
    </label>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy || !disponible}
        className="text-brand-600 underline disabled:opacity-40"
        onClick={() => void probar()}>{busy ? 'Procesando…' : 'Probar conexión'}</button>
      <button type="button" disabled={busy || !disponible}
        className="text-brand-600 underline disabled:opacity-40"
        onClick={() => void imprimirHojaPrueba()}>Imprimir hoja de prueba</button>
      <button type="button" disabled={busy} className="text-brand-600 underline disabled:opacity-40"
        onClick={() => void verCola()}>Ver cola</button>
    </div>
    {message && <p role="status" className="max-w-sm text-gray-600 dark:text-gray-300">{message}</p>}
    {pendientes && <div className="max-h-64 max-w-sm overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-700">
      <div className="mb-2 flex justify-between gap-3"><span>Cola de impresión</span>
        <button type="button" onClick={cerrarCola} aria-label="Cerrar cola">Cerrar</button></div>
      {!pendientes.length && <p>Sin comandas pendientes.</p>}
      {pendientes.map((item) => <div key={item.id} className="mb-2 border-t border-gray-200 pt-2 dark:border-gray-700">
        <p>#{item.id} · {item.pedido} · {item.estado}</p>
        {item.error && <p className="text-error-600">{item.error}</p>}
        {item.estado !== 'pendiente' && <div className="mt-1 flex gap-3">
          <button type="button" disabled={busy} className="text-brand-600 underline" onClick={() => void resolver(item, false)}>Reintentar envío</button>
          <button type="button" disabled={busy} className="text-brand-600 underline" onClick={() => void resolver(item, true)}>Ya salió en papel</button>
        </div>}
      </div>)}
    </div>}
  </div>;
}
