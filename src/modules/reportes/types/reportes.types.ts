/** Filtro común del dashboard y de los reportes (días de Lima en ISO corto). */
export type FiltroReporte = {
  fecha_desde: string;
  fecha_hasta: string;
  id_sucursal?: number | null;
};

export type ResumenVentas = {
  cantidad: number;
  total: number;
  igv: number;
  descuentos: number;
  comensales: number;
};

/** Producto vendido en el período; `monto` incluye IGV y `monto_neto` no. */
export type ProductoVendido = {
  id_producto: number;
  nombre: string;
  categoria: string;
  cantidad: number;
  cortesias: number;
  monto: number;
  monto_neto: number;
  /** Costo actual por unidad: receta vigente o costo promedio del almacén. */
  costo_unitario: number;
};

export type VentaPorDia = { fecha: string; cantidad: number; total: number; neto: number };
export type VentaPorHora = { hora: number; cantidad: number; total: number };
export type VentaPorDiaSemana = { dia: number; cantidad: number; total: number };
export type VentaPorTipo = { tipo_pedido: number; cantidad: number; total: number; comensales: number };
export type VentaPorMedio = { medio_pago: number; nombre: string; cantidad: number; total: number };
/** `mesas` = pedidos de mesa cobrados (atenciones); `cantidad` incluye llevar y delivery. */
export type VentaPorMozo = {
  id_mozo: number;
  nombre: string;
  cantidad: number;
  total: number;
  mesas: number;
  comensales: number;
};

export type VentaListado = {
  id: number;
  codigo: string;
  fecha: string;
  tipo_pedido: number;
  mesa: string | null;
  mozo: string | null;
  comensales: number;
  total: number;
  medios: string;
};

export type GastoDiarioDia = {
  fecha: string;
  efectivo: number;
  yape: number;
  credito: number;
  total: number;
};

export type GastoDiarioItem = {
  item: string;
  categoria: string;
  compras: number;
  total: number;
  credito: number;
};

export type GastoAdministrativo = {
  id: number;
  fecha: string;
  categoria: string;
  subcategoria: string | null;
  /** 1 fijo, 2 variable. */
  tipo_gasto: number;
  concepto: string;
  medio_pago: number;
  medio: string;
  num_comprobante: string | null;
  monto: number;
};

export type PagoPlanilla = {
  id: number;
  fecha: string;
  id_trabajador: number;
  trabajador: string;
  puesto: string | null;
  anio: number;
  mes: number;
  quincena: number;
  medio_pago: number;
  medio: string;
  monto: number;
  observacion: string | null;
};

export type TotalesTurno = {
  monto_apertura: number;
  ventas_efectivo: number;
  ventas_yape: number;
  ventas_tarjeta: number;
  ventas_credito: number;
  total_ventas: number;
  ingresos_caja: number;
  egresos_caja: number;
  total_cobranzas: number;
  total_pagos: number;
  efectivo_esperado: number;
};

export type TurnoReporte = {
  id: number;
  caja: string;
  cajero: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  /** 1 abierto, 2 cerrado. */
  estado_turno: number;
  monto_apertura: number;
  monto_declarado: number | null;
  monto_diferencia: number | null;
  totales: TotalesTurno;
};

export type MovimientoCaja = {
  id: number;
  fecha: string;
  caja: string;
  /** 1 ingreso, 2 egreso. */
  tipo_movimiento: number;
  monto: number;
  motivo: string;
  usuario: string | null;
};

export type CuentaReporte = {
  id_persona: number;
  nombre: string;
  num_documento: string | null;
  convenio?: string | null;
  saldo: number;
  cargos_periodo: number;
  abonos_periodo: number;
  ajustes_periodo: number;
};

export type StockReporte = {
  id: number;
  almacen: string;
  producto: string;
  unidad: string | null;
  stock_actual: number;
  stock_reservado: number;
  stock_minimo: number;
  costo_promedio: number;
  valorizado: number;
  bajo_minimo: boolean;
};

export type MovimientoInventario = {
  tipo_movimiento: string;
  motivo: string;
  movimientos: number;
  valor_entradas: number;
  valor_salidas: number;
};

export type DashboardDatos = {
  periodo: FiltroReporte;
  resumen_ventas: ResumenVentas;
  productos: ProductoVendido[];
  por_dia: VentaPorDia[];
  por_hora: VentaPorHora[];
  por_dia_semana: VentaPorDiaSemana[];
  por_tipo: VentaPorTipo[];
  por_medio: VentaPorMedio[];
  por_mozo: VentaPorMozo[];
  gastos_diarios: GastoDiarioDia[];
  gastos_administrativos: GastoAdministrativo[];
  planilla: PagoPlanilla[];
};

export type ReporteVentas = {
  periodo: FiltroReporte;
  resumen_ventas: ResumenVentas;
  productos: ProductoVendido[];
  por_medio: VentaPorMedio[];
  por_tipo: VentaPorTipo[];
  por_mozo: VentaPorMozo[];
  ventas: VentaListado[];
};

export type ReporteGastos = {
  periodo: FiltroReporte;
  gastos_diarios: GastoDiarioDia[];
  gastos_diarios_items: GastoDiarioItem[];
  gastos_administrativos: GastoAdministrativo[];
};

export type ReporteCaja = {
  periodo: FiltroReporte;
  turnos: TurnoReporte[];
  movimientos: MovimientoCaja[];
};

export type ReporteCuentas = {
  periodo: FiltroReporte;
  por_cobrar: CuentaReporte[];
  por_pagar: CuentaReporte[];
};

export type ReportePlanilla = { periodo: FiltroReporte; pagos: PagoPlanilla[] };

export type ReporteInventario = {
  periodo: FiltroReporte;
  stock: StockReporte[];
  movimientos: MovimientoInventario[];
};

export type ReporteGeneral = {
  periodo: FiltroReporte;
  resumen_ventas: ResumenVentas;
  productos: ProductoVendido[];
  por_medio: VentaPorMedio[];
  gastos_diarios: GastoDiarioDia[];
  gastos_administrativos: GastoAdministrativo[];
  planilla: PagoPlanilla[];
  turnos: TurnoReporte[];
  por_cobrar: CuentaReporte[];
  por_pagar: CuentaReporte[];
  stock: StockReporte[];
};

export type TipoReporte =
  | "ventas"
  | "gastos"
  | "caja"
  | "cuentas"
  | "planilla"
  | "inventario"
  | "general";

export type DatosReporte = {
  ventas: ReporteVentas;
  gastos: ReporteGastos;
  caja: ReporteCaja;
  cuentas: ReporteCuentas;
  planilla: ReportePlanilla;
  inventario: ReporteInventario;
  general: ReporteGeneral;
};

export type Granularidad = "dia" | "semana" | "mes";
