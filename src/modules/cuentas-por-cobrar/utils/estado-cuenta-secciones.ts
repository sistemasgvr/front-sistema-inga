import { seccion, seccionResumen, type ColumnaReporte } from "@/modules/reportes";
import type { EstadoCuentaDetalleCxc } from "../types/cxc.types";
import {
  conSaldoCorrido,
  descripcionMovimiento,
  filasPlatos,
  resumenPlatos,
  type FilaPlato,
  type MovimientoConSaldo,
} from "./estado-cuenta";

type FilaDato = { campo: string; dato: string };

const COLUMNAS_DATOS: ColumnaReporte<FilaDato>[] = [
  { clave: "campo", titulo: "Dato", valor: (f) => f.campo },
  { clave: "dato", titulo: "Valor", valor: (f) => f.dato },
];

/** Fila de movimiento para Excel; la primera puede ser el saldo anterior. */
type FilaMovimiento = Pick<MovimientoConSaldo, "fecha" | "cargo" | "abono" | "saldo"> & {
  id: number;
  concepto: string;
  pedido: string | null;
  mozo: string | null;
};

const COLUMNAS_MOVIMIENTOS: ColumnaReporte<FilaMovimiento>[] = [
  { clave: "fecha", titulo: "Fecha", valor: (m) => m.fecha, formato: "fecha" },
  { clave: "concepto", titulo: "Concepto", valor: (m) => m.concepto },
  { clave: "pedido", titulo: "Pedido", valor: (m) => m.pedido },
  { clave: "mozo", titulo: "Atendió", valor: (m) => m.mozo },
  { clave: "cargo", titulo: "Consumo", valor: (m) => m.cargo || null, formato: "moneda" },
  { clave: "abono", titulo: "Abono", valor: (m) => m.abono || null, formato: "moneda" },
  { clave: "saldo", titulo: "Saldo", valor: (m) => m.saldo, formato: "moneda" },
];

const COLUMNAS_PLATOS: ColumnaReporte<FilaPlato>[] = [
  { clave: "fecha", titulo: "Fecha", valor: (p) => p.fecha, formato: "fecha" },
  { clave: "pedido", titulo: "Pedido", valor: (p) => p.pedido },
  { clave: "mesa", titulo: "Mesa", valor: (p) => p.mesa },
  { clave: "plato", titulo: "Plato", valor: (p) => (p.cortesia ? `${p.plato} (cortesía)` : p.plato) },
  { clave: "cantidad", titulo: "Cantidad", valor: (p) => p.cantidad, formato: "numero" },
  { clave: "precio", titulo: "P. unitario", valor: (p) => p.precio, formato: "moneda" },
  { clave: "descuento", titulo: "Descuento", valor: (p) => p.descuento || null, formato: "moneda" },
  { clave: "subtotal", titulo: "Subtotal", valor: (p) => p.subtotal, formato: "moneda" },
];

type PlatoResumen = ReturnType<typeof resumenPlatos>[number];

const COLUMNAS_RESUMEN_PLATOS: ColumnaReporte<PlatoResumen>[] = [
  { clave: "plato", titulo: "Plato", valor: (p) => p.plato },
  { clave: "cantidad", titulo: "Cantidad", valor: (p) => p.cantidad, formato: "numero" },
  { clave: "monto", titulo: "Monto", valor: (p) => p.monto, formato: "moneda" },
];

/** Hojas del Excel del estado de cuenta: datos, resumen, movimientos y platos. */
export function seccionesEstadoCuenta(d: EstadoCuentaDetalleCxc, periodo: string) {
  const movimientos = conSaldoCorrido(d.saldo_anterior, d.movimientos);
  const filas: FilaMovimiento[] = [
    ...(d.periodo.fecha_desde
      ? [{ id: 0, fecha: d.periodo.fecha_desde, concepto: "Saldo anterior", pedido: null, mozo: null, cargo: 0, abono: 0, saldo: d.saldo_anterior }]
      : []),
    ...movimientos.map((m) => ({
      id: m.id,
      fecha: m.fecha,
      concepto: descripcionMovimiento(m),
      pedido: m.pedido?.codigo ?? null,
      mozo: m.pedido?.mozo ?? null,
      cargo: m.cargo,
      abono: m.abono,
      saldo: m.saldo,
    })),
  ];
  const platos = filasPlatos(d.movimientos);
  const porPlato = resumenPlatos(d.movimientos);

  return [
    seccion("Cliente", COLUMNAS_DATOS, [
      { campo: "Cliente", dato: d.nombre },
      { campo: "Documento", dato: d.num_documento ?? "—" },
      { campo: "Convenio", dato: d.convenio ?? "—" },
      { campo: "Período", dato: periodo },
    ]),
    seccionResumen("Resumen de la cuenta", [
      { concepto: "Saldo anterior", valor: d.saldo_anterior },
      { concepto: "Consumos del período", valor: d.total_cargos },
      { concepto: "Abonos del período", valor: d.total_abonos },
      { concepto: "Ajustes del período", valor: d.total_ajustes },
      { concepto: "Saldo al cierre del período", valor: d.saldo_final },
      { concepto: "Saldo actual (hoy)", valor: d.saldo_actual },
    ]),
    seccion("Movimientos", COLUMNAS_MOVIMIENTOS, filas, {
      cargo: d.total_cargos,
      abono: d.total_abonos,
      saldo: d.saldo_final,
    }),
    seccion("Detalle de platos", COLUMNAS_PLATOS, platos, {
      cantidad: platos.reduce((s, p) => s + p.cantidad, 0),
      subtotal: Math.round(platos.reduce((s, p) => s + p.subtotal, 0) * 100) / 100,
    }),
    seccion("Platos consumidos", COLUMNAS_RESUMEN_PLATOS, porPlato),
  ];
}
