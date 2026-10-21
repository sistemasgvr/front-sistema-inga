/** A single comma or point is a decimal separator, never a thousands separator. */
export function normalizarDecimal(value: string): string {
  return value.trim().replace(",", ".");
}

/** "9999999" → "9,999,999" para que el tope se lea de un vistazo. */
function formatearLimite(value: string): string {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits: 4 }) : value;
}

export function validarDecimal(value: string, min?: string, max?: string, step?: number): string {
  const normalized = normalizarDecimal(value);
  if (!normalized) return "";
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return "Introduce un número con un solo separador decimal.";
  const number = Number(normalized);
  if (!Number.isFinite(number)) return "Introduce un número válido.";
  if (min !== undefined && number < Number(min)) return `El mínimo es ${formatearLimite(min)}.`;
  if (max !== undefined && number > Number(max)) return `El máximo es ${formatearLimite(max)}.`;
  if (step === 1 && !Number.isInteger(number)) return "Introduce un número entero, sin decimales.";
  if (step && Math.abs((number - Number(min ?? 0)) / step - Math.round((number - Number(min ?? 0)) / step)) > 1e-7)
    return `Usa incrementos de ${step}.`;
  return "";
}
