/** A single comma or point is a decimal separator, never a thousands separator. */
export function normalizarDecimal(value: string): string {
  return value.trim().replace(",", ".");
}

export function validarDecimal(value: string, min?: string, max?: string, step?: number): string {
  const normalized = normalizarDecimal(value);
  if (!normalized) return "";
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return "Introduce un número con un solo separador decimal.";
  const number = Number(normalized);
  if (!Number.isFinite(number)) return "Introduce un número válido.";
  if (min !== undefined && number < Number(min)) return `El mínimo es ${min}.`;
  if (max !== undefined && number > Number(max)) return `El máximo es ${max}.`;
  if (step && Math.abs((number - Number(min ?? 0)) / step - Math.round((number - Number(min ?? 0)) / step)) > 1e-7)
    return `Usa incrementos de ${step}.`;
  return "";
}
