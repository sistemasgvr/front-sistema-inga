"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGastosDiarios } from "../hooks/use-gastos-diarios";
import { FORMA_PAGO } from "../types/gdo.types";
import {
  fechaLarga,
  formatearCantidad,
  formatearSoles,
  hoyISO,
} from "../utils/formato";
import { InsumoFormModal } from "./insumo-form-modal";
import { LineaFormModal } from "./linea-form-modal";

export function GastosDiariosView() {
  const {
    fecha,
    cambiarFecha,
    dia,
    reporte,
    categorias,
    unidades,
    proveedores,
    turnoAbierto,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    isLineaOpen,
    abrirLinea,
    cerrarLinea,
    guardarLinea,
    isInsumoOpen,
    abrirInsumo,
    cerrarInsumo,
    guardarInsumo,
    confirmLinea,
    isConfirmOpen,
    isAnulando,
    abrirConfirmAnular,
    cerrarConfirmAnular,
    confirmarAnular,
  } = useGastosDiarios();

  const lineas = dia?.detalle ?? [];
  const esHoy = fecha === hoyISO();

  return (
    <div>
      <PageBreadcrumb pageTitle="Gastos diarios" />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Icon
          name="mdi:information-outline"
          size={20}
          className="mt-0.5 shrink-0 text-brand-500"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Las compras del día para la cocina. Cada ítem indica si se pagó al
          contado o a crédito; lo que va a crédito{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            genera la deuda al proveedor automáticamente
          </span>{" "}
          en Cuentas por Pagar.
        </p>
      </div>

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

      {/* Selector de día. Encabeza la pantalla porque todo lo de abajo es de
          esa jornada. */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <Icon name="mdi:calendar-today" size={20} className="text-brand-500" />
          <div>
            <p className="text-sm font-bold text-gray-900 capitalize dark:text-white">
              {fechaLarga(fecha)}
            </p>
            {esHoy && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Hoy</p>
            )}
          </div>
        </div>

        <div className="w-40">
          <Input
            type="date"
            value={fecha}
            max={hoyISO()}
            onChange={(e) => cambiarFecha(e.target.value)}
          />
        </div>

        <div className="ml-auto">
          <Button
            size="sm"
            type="button"
            onClick={abrirLinea}
            disabled={isLoading || !dia}
            startIcon={<Icon name="mdi:cart-plus" size={18} />}
          >
            Agregar compra
          </Button>
        </div>
      </div>

      {!turnoAbierto && (
        <div className="mb-5">
          <Alert
            variant="info"
            title="No tienes un turno de caja abierto"
            message="Puedes registrar compras por Yape o a crédito. Para pagar en efectivo, abre un turno en Caja para que el egreso cuadre con el cajón."
          />
        </div>
      )}

      {/* El cuadre del día: es lo que reemplaza el Excel de egresos. */}
      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
            Total del día
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-700 dark:text-brand-300">
            {formatearSoles(dia?.dia.total_general)}
          </p>
          <p className="mt-1 text-xs text-brand-600/80 dark:text-brand-400/80">
            {lineas.length} {lineas.length === 1 ? "compra" : "compras"}
          </p>
        </div>

        {[
          {
            etiqueta: "Efectivo",
            valor: dia?.dia.total_efectivo ?? 0,
            icono: "mdi:cash",
            color: "text-success-600 dark:text-success-400",
            nota: "Sale del cajón",
          },
          {
            etiqueta: "Yape",
            valor: dia?.dia.total_yape ?? 0,
            icono: "mdi:cellphone",
            color: "text-blue-600 dark:text-blue-400",
            nota: "No toca el cajón",
          },
          {
            etiqueta: "A crédito",
            valor: dia?.dia.total_credito ?? 0,
            icono: "mdi:handshake-outline",
            color: "text-warning-600 dark:text-warning-400",
            nota: "Deuda a proveedores",
          },
        ].map((t) => (
          <div
            key={t.etiqueta}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-center gap-2">
              <Icon name={t.icono} size={16} className={t.color} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t.etiqueta}
              </span>
            </div>
            <p className={`mt-1 text-xl font-bold ${t.color}`}>
              {formatearSoles(t.valor)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{t.nota}</p>
          </div>
        ))}
      </div>

      {/* Deuda generada hoy, desglosada por proveedor: es lo que se va a abonar
          esta semana en CxP. */}
      {reporte && reporte.por_proveedor.length > 0 && (
        <div className="mb-5 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/10">
          <div className="mb-2 flex items-center gap-2">
            <Icon
              name="mdi:handshake-outline"
              size={18}
              className="text-warning-600 dark:text-warning-400"
            />
            <h4 className="text-sm font-bold text-warning-700 dark:text-warning-400">
              Deuda generada hoy
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {reporte.por_proveedor.map((p) => (
              <div
                key={p.id_persona}
                className="rounded-lg border border-warning-300 bg-white px-3 py-1.5 dark:border-warning-500/40 dark:bg-gray-900"
              >
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {p.nombre_proveedor}
                </span>
                <span className="ml-2 text-xs font-bold text-warning-700 dark:text-warning-400">
                  {formatearSoles(p.monto)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* En qué se fue el día, por categoría de la hoja física. */}
      {reporte && reporte.por_categoria.length > 0 && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Por categoría
          </h4>
          <div className="space-y-2.5">
            {reporte.por_categoria.map((cat) => {
              const porcentaje =
                reporte.total_general > 0
                  ? (cat.monto / reporte.total_general) * 100
                  : 0;
              return (
                <div key={cat.id_categoria}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {cat.nombre_categoria}
                      <span className="ml-1.5 text-gray-400">
                        ({cat.cantidad})
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-gray-800 dark:text-white">
                      {formatearSoles(cat.monto)}{" "}
                      <span className="font-normal text-gray-400">
                        ({porcentaje.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Insumo
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Cantidad
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    P. unitario
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Pago
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Subtotal
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando el día...
                    </TableCell>
                  </TableRow>
                ) : lineas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-12 text-center">
                      <Icon
                        name="mdi:cart-outline"
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sin compras registradas
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Agrega la primera compra del día.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  lineas.map((linea) => {
                    const esCredito = linea.forma_pago === FORMA_PAGO.CREDITO;
                    const esEfectivo = linea.forma_pago === FORMA_PAGO.EFECTIVO;

                    return (
                      <TableRow
                        key={linea.id}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                            {linea.nombre_insumo}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                            {linea.nombre_categoria}
                            {linea.observacion && ` · ${linea.observacion}`}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatearCantidad(linea.cantidad)}
                            {linea.simbolo_unidad && (
                              <span className="ml-1 text-gray-400">
                                {linea.simbolo_unidad}
                              </span>
                            )}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatearSoles(linea.precio_unitario)}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <Badge
                            size="sm"
                            color={
                              esEfectivo ? "success" : esCredito ? "warning" : "info"
                            }
                          >
                            {linea.forma_pago_nombre}
                          </Badge>
                          {esCredito && linea.nombre_proveedor && (
                            <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
                              {linea.nombre_proveedor}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatearSoles(linea.subtotal)}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => abrirConfirmAnular(linea)}
                            className="text-gray-500 transition-colors hover:text-error-600"
                            title="Anular esta compra"
                          >
                            <Icon name="mdi:close-circle-outline" size={19} />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <LineaFormModal
        isOpen={isLineaOpen}
        onClose={cerrarLinea}
        onSubmit={guardarLinea}
        categorias={categorias}
        unidades={unidades}
        proveedores={proveedores}
        turnoAbierto={turnoAbierto}
        onCrearInsumo={abrirInsumo}
        isSaving={isSaving}
      />

      <InsumoFormModal
        isOpen={isInsumoOpen}
        onClose={cerrarInsumo}
        onSubmit={guardarInsumo}
        categorias={categorias}
        proveedores={proveedores}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cerrarConfirmAnular}
        onConfirm={confirmarAnular}
        isLoading={isAnulando}
        variant="danger"
        title="¿Anular esta compra?"
        description={
          confirmLinea
            ? `Se anulará ${confirmLinea.nombre_insumo} por ${formatearSoles(confirmLinea.subtotal)}.${
                confirmLinea.forma_pago === FORMA_PAGO.CREDITO
                  ? " También se revertirá la deuda generada al proveedor."
                  : ""
              }`
            : ""
        }
        confirmText="Sí, anular"
        cancelText="Cancelar"
      />
    </div>
  );
}
