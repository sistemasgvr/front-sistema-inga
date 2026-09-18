"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { useMiTurno } from "../hooks/use-mi-turno";
import { TIPO_MOVIMIENTO } from "../types/caja.types";
import { formatearFechaHora, formatearSoles, tiempoTranscurrido } from "../utils/formato";
import { AbrirTurnoCard } from "./abrir-turno-card";
import { CierreTurnoModal } from "./cierre-turno-modal";
import { MovimientoFormModal } from "./movimiento-form-modal";

export function MiTurnoView() {
  const {
    nombreCajero,
    turno,
    resumen,
    cajasDisponibles,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    isMovimientoOpen,
    openMovimiento,
    closeMovimiento,
    isCierreOpen,
    openCierre,
    closeCierre,
    handleAbrirTurno,
    handleRegistrarMovimiento,
    handleCerrarTurno,
  } = useMiTurno();

  const movimientos = resumen?.movimientos ?? [];
  const efectivoEsperado = Number(turno?.efectivo_esperado ?? 0);

  return (
    <div>
      <PageBreadcrumb pageTitle="Mi turno de caja" />

      {feedback && (
        <div className="mb-5">
          <Alert
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
          />
          <button
            type="button"
            onClick={clearFeedback}
            className="mt-2 text-xs text-gray-500 underline"
          >
            Cerrar aviso
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Cargando tu turno...</p>
        </div>
      ) : !turno ? (
        <AbrirTurnoCard
          cajasDisponibles={cajasDisponibles}
          nombreCajero={nombreCajero}
          isSaving={isSaving}
          onAbrir={handleAbrirTurno}
        />
      ) : (
        <>
          {/* Cabecera del turno abierto */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15">
                <Icon name="mdi:cash-register" size={24} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {turno.nombre_caja}
                  </h3>
                  <Badge size="sm" color="success">
                    Abierto
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {turno.nombre_cajero} · abierto {formatearFechaHora(turno.fecha_apertura)}{" "}
                  ({tiempoTranscurrido(turno.fecha_apertura)})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={openMovimiento}
                startIcon={<Icon name="mdi:swap-vertical" size={17} />}
              >
                Movimiento
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={openCierre}
                startIcon={<Icon name="mdi:lock-outline" size={17} />}
              >
                Cerrar turno
              </Button>
            </div>
          </div>

          {/* El efectivo esperado va grande y solo, porque es el número que el
              cajero mira todo el día y contra el que va a cuadrar al cerrar. */}
          <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
              Efectivo que debería haber en el cajón
            </p>
            <p className="mt-1 text-3xl font-bold text-brand-700 dark:text-brand-300">
              {formatearSoles(efectivoEsperado)}
            </p>
            <p className="mt-1 text-xs text-brand-600/80 dark:text-brand-400/80">
              Apertura {formatearSoles(turno.monto_apertura)} + ventas en efectivo
              + ingresos − egresos. Yape, tarjeta y crédito no entran acá.
            </p>
          </div>

          {/* Desglose */}
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                etiqueta: "Apertura",
                valor: turno.monto_apertura,
                icono: "mdi:cash-plus",
                color: "text-gray-700 dark:text-gray-200",
              },
              {
                etiqueta: "Ventas efectivo",
                valor: turno.ventas_efectivo ?? 0,
                icono: "mdi:cash",
                color: "text-success-600 dark:text-success-400",
              },
              {
                etiqueta: "Ingresos",
                valor: turno.ingresos_caja ?? 0,
                icono: "mdi:arrow-down-bold-box-outline",
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                etiqueta: "Egresos",
                valor: turno.egresos_caja ?? 0,
                icono: "mdi:arrow-up-bold-box-outline",
                color: "text-error-500",
              },
            ].map((t) => (
              <div
                key={t.etiqueta}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <Icon name={t.icono} size={16} className={t.color} />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t.etiqueta}
                  </span>
                </div>
                <p className={`mt-1.5 text-lg font-bold ${t.color}`}>
                  {formatearSoles(t.valor)}
                </p>
              </div>
            ))}
          </div>

          {/* Ventas por medio de pago. Las muestro aparte del efectivo esperado
              justamente para dejar claro que no todas van al cajón. */}
          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
              Ventas del turno por medio de pago
            </h4>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { etiqueta: "Efectivo", valor: turno.ventas_efectivo ?? 0, icono: "mdi:cash" },
                { etiqueta: "Yape", valor: turno.ventas_yape ?? 0, icono: "mdi:cellphone" },
                { etiqueta: "Tarjeta", valor: turno.ventas_tarjeta ?? 0, icono: "mdi:credit-card-outline" },
                { etiqueta: "Crédito", valor: turno.ventas_credito ?? 0, icono: "mdi:handshake-outline" },
              ].map((m) => (
                <div key={m.etiqueta} className="flex items-center gap-2.5">
                  <Icon name={m.icono} size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {m.etiqueta}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {formatearSoles(m.valor)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Total vendido:{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {formatearSoles(turno.total_ventas ?? 0)}
              </span>
              {(turno.total_ventas ?? 0) === 0 &&
                " · Todavía no hay cobros registrados en este turno."}
            </p>
          </div>

          {/* Movimientos */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Movimientos de caja
              </h4>
              <span className="text-xs text-gray-500">{movimientos.length}</span>
            </div>

            {movimientos.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Icon
                  name="mdi:swap-vertical"
                  size={32}
                  className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sin movimientos en este turno
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Registra acá los gastos y retiros que no son ventas.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {movimientos.map((mov) => {
                  const esIngreso = mov.tipo_movimiento === TIPO_MOVIMIENTO.INGRESO;
                  return (
                    <li
                      key={mov.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          name={
                            esIngreso
                              ? "mdi:arrow-down-bold-box-outline"
                              : "mdi:arrow-up-bold-box-outline"
                          }
                          size={20}
                          className={esIngreso ? "text-success-600" : "text-error-500"}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {mov.motivo}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatearFechaHora(mov.fecha_creacion)}
                            {mov.nombre_autoriza && ` · autorizó ${mov.nombre_autoriza}`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          esIngreso ? "text-success-600" : "text-error-500"
                        }`}
                      >
                        {esIngreso ? "+" : "−"} {formatearSoles(mov.monto)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <MovimientoFormModal
            isOpen={isMovimientoOpen}
            onClose={closeMovimiento}
            onSubmit={handleRegistrarMovimiento}
            efectivoDisponible={efectivoEsperado}
            isSaving={isSaving}
          />

          <CierreTurnoModal
            isOpen={isCierreOpen}
            onClose={closeCierre}
            onSubmit={handleCerrarTurno}
            turno={turno}
            isSaving={isSaving}
          />
        </>
      )}
    </div>
  );
}
