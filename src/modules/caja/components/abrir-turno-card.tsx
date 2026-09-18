"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { FormEvent, useState } from "react";
import type { CajaItem } from "../types/caja.types";

type AbrirTurnoCardProps = {
  cajasDisponibles: CajaItem[];
  nombreCajero: string;
  isSaving: boolean;
  onAbrir: (idCaja: number, montoApertura: number, observacion?: string) => Promise<void>;
};

/**
 * Pantalla que ve el cajero cuando todavía no tiene un turno abierto.
 *
 * La dejo como tarjeta centrada y no como modal porque es el estado principal
 * de la pantalla, no una acción secundaria: mientras no abra turno, no hay nada
 * más que pueda hacer acá.
 */
export function AbrirTurnoCard({
  cajasDisponibles,
  nombreCajero,
  isSaving,
  onAbrir,
}: AbrirTurnoCardProps) {
  const [idCaja, setIdCaja] = useState<number | null>(
    cajasDisponibles.length === 1 ? cajasDisponibles[0].id : null,
  );
  const [montoApertura, setMontoApertura] = useState<number>(0);
  const [observacion, setObservacion] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);

  const sinCajas = cajasDisponibles.length === 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIntentoEnviar(true);
    if (!idCaja || isSaving) return;
    await onAbrir(idCaja, montoApertura, observacion);
  }

  return (
    <div className="mx-auto max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15">
            <Icon name="mdi:cash-register" size={24} />
          </span>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Abrir turno de caja
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {nombreCajero
                ? `Vas a abrir el turno como ${nombreCajero}.`
                : "Vas a abrir un turno."}
            </p>
          </div>
        </div>

        {sinCajas ? (
          <Alert
            variant="warning"
            title="No hay cajas libres"
            message="Todas las cajas activas ya tienen un turno abierto, o todavía no se ha creado ninguna. Revisa la pantalla de Cajas."
          />
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="id_caja">Caja *</Label>
              <Select
                options={cajasDisponibles.map((c) => ({
                  value: String(c.id),
                  label: `${c.codigo} — ${c.nombre}`,
                }))}
                defaultValue={idCaja ? String(idCaja) : ""}
                placeholder="Selecciona la caja"
                onChange={(value) => setIdCaja(Number(value))}
                disabled={isSaving}
                error={intentoEnviar && !idCaja}
                hint={
                  intentoEnviar && !idCaja
                    ? "Selecciona una caja para continuar."
                    : "Solo se listan las cajas que están libres."
                }
              />
            </div>

            <div>
              <Label htmlFor="monto_apertura">Monto de apertura (S/)</Label>
              <Input
                id="monto_apertura"
                type="number"
                step={0.01}
                min="0"
                value={montoApertura || ""}
                onChange={(e) => setMontoApertura(Number(e.target.value) || 0)}
                placeholder="0.00"
                disabled={isSaving}
                hint="El sencillo con el que arrancas el cajón. Déjalo en 0 si empiezas vacío."
              />
            </div>

            <div>
              <Label htmlFor="observacion">Observación</Label>
              <Input
                id="observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Opcional"
                disabled={isSaving}
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full"
              startIcon={<Icon name="mdi:lock-open-variant-outline" size={18} />}
            >
              {isSaving ? "Abriendo..." : "Abrir turno"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
