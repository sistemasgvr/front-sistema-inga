"use client";

import { esNumerica, formatearValor, formatoDe, type ColumnaReporte } from "../utils/columnas";

type Props<T> = {
  columnas: ColumnaReporte<T>[];
  filas: readonly T[];
  /** Totales por `clave` de columna; se muestran en la última fila. */
  totales?: Record<string, string | number>;
  claveFila: (fila: T, indice: number) => string | number;
  vacio?: string;
};

export function TablaReporte<T>({ columnas, filas, totales, claveFila, vacio = "Sin registros en el período." }: Props<T>) {
  if (!filas.length) {
    return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400 print:py-2 print:text-left">{vacio}</p>;
  }
  const alinear = (c: ColumnaReporte<T>) => (esNumerica(c) ? "text-right" : "text-left");
  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="tabla-reporte w-full min-w-max text-sm print:min-w-0">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            {columnas.map((c) => (
              <th
                key={c.clave}
                scope="col"
                className={`px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 ${alinear(c)}`}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={claveFila(fila, i)} className="border-b border-gray-100 last:border-0 dark:border-gray-800/60">
              {columnas.map((c) => (
                <td
                  key={c.clave}
                  className={`px-3 py-2 text-gray-700 dark:text-gray-300 ${alinear(c)} ${esNumerica(c) ? "tabular-nums" : ""}`}
                >
                  {formatearValor(c.valor(fila), formatoDe(c, fila))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totales && (
          <tfoot>
            <tr className="border-t-2 border-gray-200 font-semibold text-gray-800 dark:border-gray-700 dark:text-white/90">
              {columnas.map((c, i) => (
                <td key={c.clave} className={`px-3 py-2 tabular-nums ${alinear(c)}`}>
                  {c.clave in totales
                    ? formatearValor(totales[c.clave], typeof totales[c.clave] === "number" ? formatoDe(c) : "texto")
                    : i === 0
                      ? "Total"
                      : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
