/** "1 consumo", "3 consumos": evita textos como "1 consumos". */
export function plural(cantidad: number, singular: string, pluralForma = `${singular}s`): string {
  return `${cantidad} ${cantidad === 1 ? singular : pluralForma}`;
}
