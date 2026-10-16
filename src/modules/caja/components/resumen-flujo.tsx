"use client";

import { Icon } from "@/components/ui/icon";
import { formatearSoles } from "../utils/formato";

export type FilaFlujo = {
  etiqueta: string;
  valor: number;
  /** No mueve dinero de la caja (por ejemplo, el crédito: queda por cobrar). */
  neutro?: boolean;
  nota?: string;
};

/**
 * Bloque de entradas o salidas del turno. El color, el ícono y el signo dicen
 * de un vistazo si el dinero entró o salió, para no confundir una venta con un
 * pago cuando los montos se parecen.
 */
export const TONO_FLUJO = {
  entrada: {
    icono: "mdi:arrow-bottom-left-thick",
    signo: "+",
    texto: "text-success-600 dark:text-success-400",
    borde: "border-success-200 dark:border-success-500/30",
    fondo: "bg-success-50/60 dark:bg-success-500/5",
    insignia: "bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  },
  salida: {
    icono: "mdi:arrow-top-right-thick",
    signo: "−",
    texto: "text-error-600 dark:text-error-400",
    borde: "border-error-200 dark:border-error-500/30",
    fondo: "bg-error-50/60 dark:bg-error-500/5",
    insignia: "bg-error-100 text-error-600 dark:bg-error-500/15 dark:text-error-400",
  },
} as const;

type ResumenFlujoProps = {
  tipo: keyof typeof TONO_FLUJO;
  titulo: string;
  descripcion: string;
  filas: FilaFlujo[];
  etiquetaTotal: string;
  pie?: string;
};

export function ResumenFlujo({ tipo, titulo, descripcion, filas, etiquetaTotal, pie }: ResumenFlujoProps) {
  const tono = TONO_FLUJO[tipo];
  const total = filas.filter((f) => !f.neutro).reduce((s, f) => s + Number(f.valor || 0), 0);

  return (
    <div className={`rounded-xl border ${tono.borde} ${tono.fondo} p-4`}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tono.insignia}`}>
          <Icon name={tono.icono} size={18} />
        </span>
        <div>
          <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">{titulo}</h5>
          <p className="text-xs text-gray-500 dark:text-gray-400">{descripcion}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {filas.map((f) => {
          const vacio = !Number(f.valor);
          return (
            <div key={f.etiqueta} className="rounded-lg bg-white/70 px-3 py-2 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">{f.etiqueta}</p>
              <p
                className={`text-sm font-semibold ${
                  vacio || f.neutro ? "text-gray-500 dark:text-gray-400" : tono.texto
                }`}
              >
                {vacio || f.neutro ? "" : `${tono.signo} `}
                {formatearSoles(f.valor)}
              </p>
              {f.nota && <p className="text-[11px] leading-tight text-gray-400">{f.nota}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-gray-200/70 pt-3 dark:border-gray-700/60">
        <span className="text-xs text-gray-500 dark:text-gray-400">{pie}</span>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {etiquetaTotal}{" "}
          <span className={`font-bold ${total ? tono.texto : "text-gray-500"}`}>
            {total ? `${tono.signo} ` : ""}
            {formatearSoles(total)}
          </span>
        </span>
      </div>
    </div>
  );
}
