"use client";

import type { useTurnoPendiente } from "../hooks/use-turno-pendiente";
import { CierreTurnoModal } from "./cierre-turno-modal";
import { TurnoPendienteModal } from "./turno-pendiente-modal";

/**
 * Alerta de caja pendiente de cierre para pantallas que cobran. Recibe el
 * estado de `useTurnoPendiente` y reutiliza los mismos modales de "Mi turno".
 * El arqueo de cierre solo se monta para quien puede cerrar la caja.
 */
export function TurnoPendienteGuard({ control }: { control: ReturnType<typeof useTurnoPendiente> }) {
  if (!control.turno) return null;

  return (
    <>
      <TurnoPendienteModal
        isOpen={!control.isCierreOpen}
        turno={control.turno}
        puedeCerrar={control.puedeCerrar}
        esPropio={control.esPropio}
        onCerrar={control.abrirCierre}
        onContinuar={control.continuar}
      />
      {control.puedeCerrar && (
        <CierreTurnoModal
          isOpen={control.isCierreOpen}
          onClose={control.cancelarCierre}
          onSubmit={control.cerrar}
          turno={control.turno}
          isSaving={control.isSaving}
        />
      )}
    </>
  );
}
