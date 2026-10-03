import type { EstadoImpresion } from "../types/impresion.types";

const COLOR: Record<EstadoImpresion['nivel'], string> = {
  inactivo: 'bg-gray-400', ok: 'bg-success-500', error: 'bg-error-500', pausado: 'bg-warning-500',
};

export function EstadoImpresionPunto({ nivel }: { nivel: EstadoImpresion['nivel'] }) {
  return <span aria-hidden className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${COLOR[nivel]}`} />;
}
