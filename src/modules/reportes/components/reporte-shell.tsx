"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { DateRangePicker } from "@/components/form/DateRangePicker";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { formatearRango, hoyIso, type RangoFechas } from "@/shared/utils/fecha";
import type { TipoReporte } from "../types/reportes.types";
import { REPORTES, reporteDe } from "../utils/catalogo";
import type { SeccionExportCualquiera } from "../utils/columnas";
import { exportarExcel } from "../utils/descarga";
import { nombreArchivo } from "../utils/nombre-archivo";
import { fechaHoraLima } from "../utils/formato";

export const EMPRESA = "Restaurante Ingá";

type Props = {
  tipo: TipoReporte;
  rango: RangoFechas;
  onRangoChange: (rango: RangoFechas) => void;
  cargando: boolean;
  error: string | null;
  onRecargar: () => void;
  /** Secciones a exportar (una hoja de Excel por sección); null mientras no hay datos. */
  exportar: (() => SeccionExportCualquiera[]) | null;
  /** Aviso bajo los filtros (p. ej. que el stock es una foto actual). */
  nota?: string;
  children: ReactNode;
};

/**
 * Marco común de los reportes: pestañas por módulo (solo las permitidas),
 * rango de fechas, exportación a Excel e impresión. Al imprimir se ocultan el
 * menú, la cabecera y los controles, y se usa el diseño de papel de
 * `globals.css` (A4 horizontal, tablas con bordes y numeración de páginas).
 */
export function ReporteShell({ tipo, rango, onRangoChange, cargando, error, onRecargar, exportar, nota, children }: Props) {
  const reporte = reporteDe(tipo);
  const hoy = useMemo(() => hoyIso(), []);
  const pestanas = useMemo(() => {
    const user = getStoredUser();
    return REPORTES.filter((r) => user?.es_super_admin || user?.permisos?.includes(r.permiso));
  }, []);
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState<string | null>(null);
  const [impreso, setImpreso] = useState("");

  async function exportarXlsx() {
    if (!exportar || exportando) return;
    setExportando(true);
    setErrorExportar(null);
    try {
      await exportarExcel(nombreArchivo(reporte.titulo, rango.desde, rango.hasta), {
        empresa: EMPRESA,
        titulo: reporte.titulo,
        periodo: formatearRango(rango),
        generado: fechaHoraLima(),
        secciones: exportar(),
      });
    } catch (e) {
      setErrorExportar(e instanceof Error ? e.message : "No se pudo generar el archivo de Excel.");
    } finally {
      setExportando(false);
    }
  }

  /** El título de la pestaña es el nombre que el navegador propone para el PDF. */
  function imprimir() {
    const anterior = document.title;
    setImpreso(fechaHoraLima());
    document.title = nombreArchivo(reporte.titulo, rango.desde, rango.hasta, "pdf").replace(/\.pdf$/, "");
    window.addEventListener("afterprint", () => (document.title = anterior), { once: true });
    // Deja que React pinte la hora de impresión antes de abrir el diálogo.
    setTimeout(() => window.print(), 50);
  }

  return (
    <div data-imprimir-reporte="" className="reporte-imprimible">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Reportes</h2>
      </div>

      <nav aria-label="Reportes por módulo" className="mb-4 border-b border-gray-200 dark:border-gray-800 print:hidden">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {pestanas.map((r) => {
            const activo = r.tipo === tipo;
            return (
              <li key={r.tipo}>
                <Link
                  href={r.ruta}
                  aria-current={activo ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                    activo
                      ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon name={r.icono} size={16} aria-hidden="true" />
                  {r.titulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mb-5 flex flex-wrap items-end gap-3 print:hidden">
        <div className="w-full sm:w-72">
          <DateRangePicker label="Período" value={rango} onChange={onRangoChange} max={hoy} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRecargar}
          disabled={cargando}
          startIcon={<Icon name="mdi:refresh" size={18} aria-hidden="true" />}
        >
          Actualizar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportarXlsx}
          disabled={!exportar || cargando || exportando}
          startIcon={<Icon name={exportando ? "mdi:loading" : "mdi:microsoft-excel"} className={exportando ? "animate-spin" : ""} size={18} aria-hidden="true" />}
        >
          {exportando ? "Generando Excel…" : "Exportar Excel"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={imprimir}
          disabled={!exportar || cargando}
          startIcon={<Icon name="mdi:printer-outline" size={18} aria-hidden="true" />}
        >
          Imprimir / PDF
        </Button>
        {errorExportar && (
          <p className="w-full text-sm text-error-600 dark:text-error-500" role="alert">
            {errorExportar}
          </p>
        )}
      </div>

      {/* Encabezado que solo sale en papel. */}
      <div className="encabezado-impresion mb-5 hidden items-end justify-between gap-6 border-b-2 border-gray-800 pb-3 print:flex">
        <div className="flex items-center gap-4">
          <Image src="/images/logo/logo-brand.png" alt="Ingá" width={70} height={36} style={{ width: 70, height: 36 }} />
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">{EMPRESA}</p>
            <h1 className="text-xl font-semibold text-gray-900">{reporte.titulo}</h1>
          </div>
        </div>
        <div className="text-right text-xs text-gray-600">
          <p>
            <span className="font-medium text-gray-800">Período:</span> {formatearRango(rango)}
          </p>
          {impreso && <p>Impreso: {impreso}</p>}
        </div>
      </div>

      {nota && <p className="nota-reporte mb-4 text-xs text-gray-500 dark:text-gray-400">{nota}</p>}

      {!rango.desde || !rango.hasta ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Elige la fecha final del período.</p>
      ) : error ? (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <p className="font-medium">No se pudo cargar el reporte.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400" role="status">
          <Icon name="mdi:loading" className="animate-spin" size={20} aria-hidden="true" />
          Cargando reporte…
        </div>
      ) : (
        <div className="space-y-5 print:space-y-4">{children}</div>
      )}
    </div>
  );
}
