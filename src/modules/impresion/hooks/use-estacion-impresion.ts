"use client";

import { useState } from "react";
import type { EstacionItem } from "@/modules/estaciones/types/estaciones.types";
import type { PendienteImpresion } from "../types/impresion.types";
import { useImpresion } from "./use-impresion";
import { listarPendientesImpresion, resolverImpresion } from "../services/impresion.service";
import { imprimirPrueba, probarConexion } from "../services/qz.service";

export function useEstacionImpresion(estacion: EstacionItem) {
  const { estaciones, configurar } = useImpresion();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pendientes, setPendientes] = useState<PendienteImpresion[] | null>(null);
  const selected = estaciones.includes(Number(estacion.id));
  async function cargar() {
    setPendientes(await listarPendientesImpresion(Number(estacion.id)));
  }
  async function ejecutar(action: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  async function resolver(item: PendienteImpresion, enviado: boolean) {
    const question = enviado ? `¿Confirmas que la comanda ${item.id} ya salió en papel?`
      : `Revisa la impresora antes de continuar. ¿Reenviar la comanda ${item.id}? Si ya salió, se duplicará.`;
    if (!window.confirm(question)) return;
    await ejecutar(async () => {
      await resolverImpresion(item.id, enviado);
      await cargar();
      setMessage(enviado ? 'Comanda resuelta como enviada' : 'Comanda pendiente de nuevo envío');
    });
  }
  function probar() {
    return ejecutar(async () => {
      await probarConexion(estacion.impresora_ip ?? '');
      setMessage('Conexión TCP disponible (puerto 9100). No se ha impreso papel.');
    });
  }
  function imprimirHojaPrueba() {
    return ejecutar(async () => {
      await imprimirPrueba(estacion.impresora_ip ?? '', estacion.nombre);
      setMessage('Hoja de prueba enviada. Verifica que haya salido el ticket.');
    });
  }
  // Marcar la estación ya inicia la recepción en esta PC; desmarcar todas la detiene.
  function seleccionar(checked: boolean) {
    const id = Number(estacion.id);
    configurar(checked ? [...estaciones.filter((e) => e !== id), id] : estaciones.filter((e) => e !== id));
  }
  return { busy, message, pendientes, selected, seleccionar, probar, imprimirHojaPrueba, resolver,
    verCola: () => ejecutar(cargar), cerrarCola: () => setPendientes(null) };
}
