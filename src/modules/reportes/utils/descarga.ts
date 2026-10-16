import { construirLibro, type DatosLibro } from "./excel";

const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Descarga un archivo generado en el navegador. */
export function descargarBlob(nombre: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Genera y descarga el .xlsx. ExcelJS (~1 MB) se carga recién aquí, para no
 * sumarlo a las páginas que nunca exportan.
 */
export async function exportarExcel(nombre: string, datos: DatosLibro) {
  const excel = await import("exceljs");
  const libro = construirLibro(excel.default ?? excel, datos);
  const buffer = await libro.xlsx.writeBuffer();
  descargarBlob(nombre, new Blob([buffer], { type: TIPO_XLSX }));
}
