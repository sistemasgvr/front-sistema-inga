"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

type Props = {
  /** Parámetros de la URL que la vista sabe atender (ej. ["pedido"]). */
  nombres: string[];
  /** Se llama una vez por cada llegada de esos parámetros; luego se quitan de la URL. */
  onParametros: (valores: Record<string, string>) => void;
};

function Escucha({ nombres, onParametros }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handler = useRef(onParametros);
  // Se actualiza antes del efecto de abajo (los efectos corren en orden).
  useEffect(() => {
    handler.current = onParametros;
  });

  const clave = nombres.map((n) => `${n}=${params.get(n) ?? ""}`).join("&");

  useEffect(() => {
    const valores: Record<string, string> = {};
    for (const n of nombres) {
      const v = params.get(n);
      if (v) valores[n] = v;
    }
    if (Object.keys(valores).length === 0) return;
    handler.current(valores);
    // Se limpian para que recargar la página no repita la acción y que un nuevo
    // clic en la misma notificación vuelva a dispararla.
    const resto = new URLSearchParams(params.toString());
    nombres.forEach((n) => resto.delete(n));
    const query = resto.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/**
 * Atiende enlaces profundos (p. ej. desde una notificación): `/ventas?venta=12`
 * abre la venta 12. Va en su propio Suspense para no bloquear el prerender de la página.
 */
export default function ParametrosRuta(props: Props) {
  return (
    <Suspense fallback={null}>
      <Escucha {...props} />
    </Suspense>
  );
}
