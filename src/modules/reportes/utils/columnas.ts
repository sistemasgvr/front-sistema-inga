import { formatoFecha, formatoMoneda, formatoNumero, formatoPorcentaje } from "./formato";

export type FormatoColumna = "texto" | "moneda" | "numero" | "porcentaje" | "fecha";

export type ValorCelda = string | number | boolean | null | undefined;

/**
 * Una columna sirve para la tabla en pantalla y para el Excel: la tabla
 * muestra el valor formateado y el Excel lleva el valor crudo con su formato
 * de celda, para que se pueda sumar y filtrar.
 *
 * `formato` puede depender de la fila cuando una misma columna mezcla montos y
 * conteos (los resúmenes de concepto / valor).
 */
export type ColumnaReporte<T> = {
  clave: string;
  titulo: string;
  valor: (fila: T) => ValorCelda;
  formato?: FormatoColumna | ((fila: T) => FormatoColumna);
};

/** Tabla lista para pantalla y exportación, con sus totales por `clave` de columna. */
export type SeccionExport<T> = {
  titulo: string;
  columnas: ColumnaReporte<T>[];
  filas: readonly T[];
  totales?: Record<string, number | string>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SeccionExportCualquiera = SeccionExport<any>;

export function formatoDe<T>(columna: ColumnaReporte<T>, fila?: T): FormatoColumna {
  if (typeof columna.formato === "function") return fila === undefined ? "numero" : columna.formato(fila);
  return columna.formato ?? "texto";
}

export function formatearValor(valor: ValorCelda, formato: FormatoColumna = "texto"): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  switch (formato) {
    case "moneda":
      return formatoMoneda(Number(valor));
    case "numero":
      return formatoNumero(Number(valor));
    case "porcentaje":
      return formatoPorcentaje(Number(valor));
    case "fecha":
      return formatoFecha(String(valor));
    default:
      return String(valor);
  }
}

/** Las columnas numéricas (o con formato por fila) se alinean a la derecha. */
export const esNumerica = <T,>(columna: ColumnaReporte<T>) =>
  typeof columna.formato === "function" ||
  columna.formato === "moneda" ||
  columna.formato === "numero" ||
  columna.formato === "porcentaje";

export function seccion<T>(
  titulo: string,
  columnas: ColumnaReporte<T>[],
  filas: readonly T[],
  totales?: Record<string, number | string>,
): SeccionExport<T> {
  return { titulo, columnas, filas, totales };
}

export type FilaResumen = { concepto: string; valor: number; formato?: FormatoColumna };

export const COLUMNAS_RESUMEN: ColumnaReporte<FilaResumen>[] = [
  { clave: "concepto", titulo: "Concepto", valor: (f) => f.concepto },
  { clave: "valor", titulo: "Valor", valor: (f) => f.valor, formato: (f) => f.formato ?? "moneda" },
];

/** Tabla concepto / valor; el valor es moneda salvo que la fila diga otra cosa. */
export const seccionResumen = (titulo: string, filas: FilaResumen[]) => seccion(titulo, COLUMNAS_RESUMEN, filas);
