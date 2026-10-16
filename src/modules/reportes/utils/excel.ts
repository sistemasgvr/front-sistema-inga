import type * as ExcelJSTipos from "exceljs";
import type { FormatoColumna, SeccionExportCualquiera, ValorCelda } from "./columnas";

/**
 * Libro de Excel (.xlsx) de un reporte, con ExcelJS.
 *
 * Cada sección va en su propia hoja: encabezado de la empresa, título y
 * período; cabecera con filtro y fija al desplazarse; montos en soles, cantidades
 * y porcentajes como números con formato (se pueden sumar); fechas como fechas
 * de Excel; fila de totales; y configuración de impresión A4 horizontal
 * ajustada al ancho de la hoja.
 *
 * ExcelJS se recibe como parámetro para que este archivo no lo importe: así la
 * librería solo se descarga al exportar y la lógica se puede probar en Node.
 */

type ExcelJS = typeof ExcelJSTipos;

export type DatosLibro = {
  empresa: string;
  titulo: string;
  periodo: string;
  generado: string;
  secciones: SeccionExportCualquiera[];
};

const COLOR = {
  marca: "FFE51B23",
  cabecera: "FF344054",
  textoCabecera: "FFFFFFFF",
  cebra: "FFF9FAFB",
  total: "FFF2F4F7",
  borde: "FFD0D5DD",
  gris: "FF667085",
};

/** Fila donde empieza la tabla: 1 empresa, 2 sección, 3 datos del reporte, 4 en blanco. */
export const FILA_CABECERA = 5;

const MAX_NOMBRE_HOJA = 31;

/** Nombre de hoja válido en Excel: sin []:*?/\, hasta 31 caracteres y sin repetirse. */
export function nombreHoja(titulo: string, usados: Set<string>): string {
  const limpio = titulo.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim() || "Hoja";
  let nombre = limpio.slice(0, MAX_NOMBRE_HOJA).trim();
  for (let n = 2; usados.has(nombre.toLowerCase()); n++) {
    const sufijo = ` (${n})`;
    nombre = limpio.slice(0, MAX_NOMBRE_HOJA - sufijo.length).trim() + sufijo;
  }
  usados.add(nombre.toLowerCase());
  return nombre;
}

/**
 * `2026-10-15` o `2026-10-15 10:54` a fecha de Excel. Se arma en UTC porque
 * ExcelJS convierte con la hora UTC: así el día y la hora no se desplazan.
 */
export function aFechaExcel(texto: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(texto.trim());
  if (!m) return null;
  const fecha = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0));
  return fecha.getUTCDate() === +m[3] ? fecha : null;
}

const conHora = (texto: string) => /\d{2}:\d{2}$/.test(texto.trim());

/** Formato de número de Excel según el tipo de columna. */
export function formatoExcel(formato: FormatoColumna, opciones: { enteros?: boolean; hora?: boolean } = {}): string | undefined {
  switch (formato) {
    case "moneda":
      return '"S/" #,##0.00;[Red]-"S/" #,##0.00';
    case "numero":
      return opciones.enteros ? "#,##0" : "#,##0.00";
    case "porcentaje":
      // Los porcentajes ya vienen en puntos (59.9), no en fracción (0.599).
      return '0.0" %"';
    case "fecha":
      return opciones.hora ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy";
    default:
      return undefined;
  }
}

/** Valor que se escribe en la celda: número, fecha, texto o vacío. */
export function valorExcel(valor: ValorCelda, formato: FormatoColumna): string | number | Date | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (formato === "fecha" && typeof valor === "string") return aFechaExcel(valor) ?? valor;
  if (formato === "moneda" || formato === "numero" || formato === "porcentaje") {
    const n = Number(valor);
    return Number.isFinite(n) ? n : String(valor);
  }
  return typeof valor === "number" ? valor : String(valor);
}

/** Ancho de columna en caracteres, según el texto más largo (con tope). */
export function anchoColumna(textos: string[], minimo = 10, maximo = 48): number {
  const largo = textos.reduce((max, t) => Math.max(max, t.length), 0);
  return Math.min(maximo, Math.max(minimo, largo + 2));
}

function textoParaAncho(valor: ReturnType<typeof valorExcel>, formato: FormatoColumna): string {
  if (valor === null) return "";
  if (valor instanceof Date) return "00/00/0000 00:00";
  if (typeof valor === "number") {
    const base = valor.toLocaleString("en-US", { minimumFractionDigits: formato === "numero" ? 0 : 2, maximumFractionDigits: 2 });
    return formato === "moneda" ? `S/ ${base}` : formato === "porcentaje" ? `${base} %` : base;
  }
  return valor;
}

export function construirLibro(excel: ExcelJS, datos: DatosLibro): ExcelJSTipos.Workbook {
  const libro = new excel.Workbook();
  libro.creator = datos.empresa;
  libro.title = datos.titulo;
  libro.created = new Date();

  const usados = new Set<string>();
  for (const seccion of datos.secciones) {
    const columnas = seccion.columnas;
    const total = Math.max(columnas.length, 1);
    const hoja = libro.addWorksheet(nombreHoja(seccion.titulo, usados), {
      views: [{ state: "frozen", ySplit: FILA_CABECERA, showGridLines: false }],
      pageSetup: {
        paperSize: 9,
        orientation: columnas.length > 4 ? "landscape" : "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 },
        printTitlesRow: `${FILA_CABECERA}:${FILA_CABECERA}`,
      },
      headerFooter: {
        oddFooter: `&L&8${datos.empresa} · ${datos.titulo}&R&8Página &P de &N`,
      },
    });

    // Encabezado del reporte.
    const encabezados: [string, Partial<ExcelJSTipos.Font>][] = [
      [datos.empresa, { bold: true, size: 14, color: { argb: COLOR.marca } }],
      [seccion.titulo, { bold: true, size: 12 }],
      [`${datos.titulo} · Período: ${datos.periodo} · Generado: ${datos.generado}`, { italic: true, size: 9, color: { argb: COLOR.gris } }],
    ];
    encabezados.forEach(([texto, fuente], i) => {
      const fila = hoja.getRow(i + 1);
      fila.getCell(1).value = texto;
      fila.getCell(1).font = fuente;
      if (total > 1) hoja.mergeCells(i + 1, 1, i + 1, total);
    });

    // Cabecera de la tabla.
    const cabecera = hoja.getRow(FILA_CABECERA);
    columnas.forEach((c, i) => {
      const celda = cabecera.getCell(i + 1);
      celda.value = c.titulo;
      celda.font = { bold: true, color: { argb: COLOR.textoCabecera } };
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.cabecera } };
      celda.alignment = { vertical: "middle", wrapText: true };
    });
    cabecera.height = 20;

    const anchos = columnas.map((c) => [c.titulo]);
    // Una columna "numero" sin decimales se muestra sin ",00".
    const enteros = columnas.map((c) =>
      seccion.filas.every((f) => {
        const v = c.valor(f);
        return v === null || v === undefined || typeof v !== "number" || Number.isInteger(v);
      }),
    );

    seccion.filas.forEach((fila, r) => {
      const excelFila = hoja.getRow(FILA_CABECERA + 1 + r);
      columnas.forEach((c, i) => {
        const formato = typeof c.formato === "function" ? c.formato(fila) : (c.formato ?? "texto");
        const crudo = c.valor(fila);
        const valor = valorExcel(crudo, formato);
        const celda = excelFila.getCell(i + 1);
        celda.value = valor;
        // Con formato por fila (resúmenes) cada celda decide: un conteo va sin decimales.
        const porFila = typeof c.formato === "function";
        const numFmt = formatoExcel(formato, {
          enteros: porFila ? typeof valor === "number" && Number.isInteger(valor) : enteros[i],
          hora: typeof crudo === "string" && conHora(crudo),
        });
        if (numFmt && (typeof valor === "number" || valor instanceof Date)) celda.numFmt = numFmt;
        celda.border = { bottom: { style: "thin", color: { argb: COLOR.borde } } };
        if (r % 2 === 1) celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.cebra } };
        anchos[i].push(textoParaAncho(valor, formato));
      });
    });

    if (!seccion.filas.length) {
      const celda = hoja.getRow(FILA_CABECERA + 1).getCell(1);
      celda.value = "Sin registros en el período.";
      celda.font = { italic: true, color: { argb: COLOR.gris } };
    }

    if (seccion.totales && seccion.filas.length) {
      const excelFila = hoja.getRow(FILA_CABECERA + 1 + seccion.filas.length);
      columnas.forEach((c, i) => {
        const celda = excelFila.getCell(i + 1);
        const formato = typeof c.formato === "function" ? "numero" : (c.formato ?? "texto");
        if (c.clave in seccion.totales!) {
          const valor = valorExcel(seccion.totales![c.clave], formato);
          celda.value = valor;
          const numFmt = formatoExcel(formato, { enteros: enteros[i] });
          if (numFmt && typeof valor === "number") celda.numFmt = numFmt;
        } else if (i === 0) {
          celda.value = "Total";
        }
        celda.font = { bold: true };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.total } };
        celda.border = { top: { style: "medium", color: { argb: COLOR.cabecera } } };
      });
    }

    if (seccion.filas.length > 1) {
      hoja.autoFilter = {
        from: { row: FILA_CABECERA, column: 1 },
        to: { row: FILA_CABECERA + seccion.filas.length, column: total },
      };
    }

    columnas.forEach((_, i) => {
      hoja.getColumn(i + 1).width = anchoColumna(anchos[i]);
    });
  }
  return libro;
}
