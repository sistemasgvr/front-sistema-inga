"use client";

import { useState } from "react";
import { crearEnvioUnico } from "@/shared/utils/envio-unico";

/**
 * Evita el doble envío de un formulario o acción. `enviando` sirve para
 * deshabilitar el botón y mostrar la carga; la guardia interna descarta un
 * segundo envío aunque React aún no haya re-renderizado.
 */
export function useEnvioUnico() {
  const [enviando, setEnviando] = useState(false);
  const [guardia] = useState(() => crearEnvioUnico(setEnviando));
  return { enviando, ejecutar: guardia.ejecutar };
}
