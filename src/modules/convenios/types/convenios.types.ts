/**
 * Tipos del maestro de convenios de crédito.
 *
 * Un convenio es una empresa del consorcio (GVR, 4G, ApuSalud, Jurisconta) cuyo
 * personal consume en el restaurante y lo paga después, por quincena.
 */

export type ConvenioStatus = 1 | 0;

export type ConvenioItem = {
  id: number;
  codigo: string;
  nombre: string;
  id_condicion_pago: number;
  nombre_condicion_pago: string;
  dias_credito: number;
  limite_credito: number;
  corte_quincenal: boolean;
  /**
   * Cuántos clientes activos dependen de este convenio.
   * Lo uso para avisar antes de dar de baja: si tiene gente asignada,
   * la baja va a fallar y prefiero decirlo antes de que lo intente.
   */
  personas_asignadas: number;
  estado: ConvenioStatus;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type ConvenioFormValues = {
  codigo: string;
  nombre: string;
  id_condicion_pago: number | null;
  limite_credito: number;
  corte_quincenal: boolean;
};

export type CondicionPagoItem = {
  id: number;
  codigo: string;
  nombre: string;
  dias_credito: number;
};

export type ConvenioStatusFilter = "todos" | "activos" | "inactivos";

export type ConveniosResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListConveniosParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: ConvenioStatusFilter;
};

export type ListConveniosResult = {
  registros: ConvenioItem[];
  total: number;
  resumen?: ConveniosResumen;
};
