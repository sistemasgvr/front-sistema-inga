import { hoyIso } from "@/shared/utils/fecha";
import type { RangoFechas } from "@/shared/utils/fecha";

/** Del primer día del mes en curso (Lima) hasta hoy. */
export function rangoMesActual(): RangoFechas {
  const hoy = hoyIso();
  return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
}

export function rangoHoy(): RangoFechas {
  const hoy = hoyIso();
  return { desde: hoy, hasta: hoy };
}
