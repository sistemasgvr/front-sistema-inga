/** `ventas_y_platos_2026-10-01_2026-10-31.xlsx`; un solo día no repite la fecha. */
export function nombreArchivo(base: string, desde: string, hasta: string, extension = "xlsx"): string {
  const limpio = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const rango = desde === hasta ? desde : `${desde}_${hasta}`;
  return `${limpio}_${rango}.${extension}`;
}
