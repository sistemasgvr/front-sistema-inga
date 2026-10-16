import type { ReactNode } from "react";
import type { SeccionExport } from "../utils/columnas";
import { TablaReporte } from "./tabla-reporte";

type Props = {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  className?: string;
};

/** Bloque con título de un reporte; en papel pierde el borde y el relleno lateral. */
export function SeccionReporte({ titulo, descripcion, children, className = "" }: Props) {
  return (
    <section
      className={`seccion-reporte rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] print:rounded-none print:border-0 ${className}`}
    >
      <div className="titulo-seccion px-5 pt-4 pb-2 print:px-0">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{titulo}</h3>
        {descripcion && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{descripcion}</p>}
      </div>
      <div className="px-2 pb-3 print:px-0">{children}</div>
    </section>
  );
}

type PropsTabla<T> = {
  seccion: SeccionExport<T>;
  claveFila: (fila: T, indice: number) => string | number;
  descripcion?: string;
  vacio?: string;
  className?: string;
};

/** La misma sección que se exporta a Excel, mostrada como tabla con su título y totales. */
export function TablaSeccion<T>({ seccion, claveFila, descripcion, vacio, className }: PropsTabla<T>) {
  return (
    <SeccionReporte titulo={seccion.titulo} descripcion={descripcion} className={className}>
      <TablaReporte columnas={seccion.columnas} filas={seccion.filas} totales={seccion.totales} claveFila={claveFila} vacio={vacio} />
    </SeccionReporte>
  );
}
