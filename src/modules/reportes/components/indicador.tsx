import { Icon } from "@/components/ui/icon";

type Props = {
  titulo: string;
  valor: string;
  detalle?: string;
  icono?: string;
  /** Resalta resultados negativos (pérdida, faltante) con icono y color de alerta. */
  negativo?: boolean;
};

/** Cifra destacada (KPI) del dashboard y de los reportes. */
export function Indicador({ titulo, valor, detalle, icono, negativo }: Props) {
  return (
    <div className={`indicador rounded-2xl border border-gray-200 bg-white p-4 break-inside-avoid dark:border-gray-800 dark:bg-white/[0.03] ${negativo ? "negativo" : ""}`}>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {icono && <Icon name={icono} size={18} aria-hidden="true" />}
        <span>{titulo}</span>
      </div>
      <p
        className={`valor-indicador mt-2 flex items-center gap-1 text-xl font-semibold tabular-nums ${
          negativo ? "text-error-600 dark:text-error-500" : "text-gray-800 dark:text-white/90"
        }`}
      >
        {negativo && <Icon name="mdi:trending-down" size={20} aria-label="Resultado negativo" />}
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detalle}</p>}
    </div>
  );
}
