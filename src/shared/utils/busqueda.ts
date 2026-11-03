/*
  Minúsculas, sin tildes y sin espacios sobrantes.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Cuánto se parece una ruta a lo escrito. Más alto es mejor:
 * 3 = el nombre empieza igual, 2 = el nombre lo contiene,
 * 1 = lo contiene la sección, 0 = no coincide.
 */
export function puntajeCoincidencia(
  nombre: string,
  seccion: string,
  busqueda: string,
): number {
  const nombreNormalizado = normalizarTexto(nombre);
  const seccionNormalizada = normalizarTexto(seccion);
  const termino = normalizarTexto(busqueda);

  if (!termino) return 0;
  if (nombreNormalizado.startsWith(termino)) return 3;
  if (nombreNormalizado.includes(termino)) return 2;
  if (seccionNormalizada.includes(termino)) return 1;
  return 0;
}
