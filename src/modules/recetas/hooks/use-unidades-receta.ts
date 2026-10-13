"use client";
import { useCallback, useEffect } from "react";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { getUnidadesMedida } from "@/modules/productos/services/productos.service";

export function useUnidadesReceta(open: boolean, base?: number) {
  const catalogo = useLazyOptions(useCallback(async () => [await getUnidadesMedida()], []));
  const { load } = catalogo;
  useEffect(() => { if (open) void load(); }, [open, load]);
  const data = catalogo.options[0];
  const compatibles = (data?.unidades ?? []).flatMap(unidad => {
    if (Number(unidad.id) === Number(base)) return [{ ...unidad, factor: 1 }];
    const directa = data?.conversiones.find(c => Number(c.id_unidad_origen) === Number(unidad.id) && Number(c.id_unidad_destino) === Number(base));
    const inversa = data?.conversiones.find(c => Number(c.id_unidad_destino) === Number(unidad.id) && Number(c.id_unidad_origen) === Number(base));
    const factor = directa ? Number(directa.factor) : inversa ? 1 / Number(inversa.factor) : 0;
    return factor > 0 && Number.isFinite(factor) ? [{ ...unidad, factor }] : [];
  });
  return { ...catalogo, compatibles };
}
