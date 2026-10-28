import Badge from "@/components/ui/badge/Badge";
import type { EstadoSunat } from "../types/sunat.types";
import { ESTADO_SUNAT } from "../utils/sunat";

/** Estado SUNAT con el mismo color y texto en Ventas, la bandeja y los lotes. */
export function EstadoSunatBadge({ estado, titulo }: { estado: EstadoSunat | null | undefined; titulo?: string }) {
  const info = ESTADO_SUNAT[(estado ?? 0) as EstadoSunat] ?? ESTADO_SUNAT[0];
  return (
    <span title={titulo ?? info.ayuda}>
      <Badge size="sm" color={info.color}>
        SUNAT: {info.label}
      </Badge>
    </span>
  );
}
