"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  guardarConfiguracionSunat,
  obtenerConfiguracionSunat,
  probarConexionSunat,
  subirCertificadoSunat,
} from "../services/sunat.service";
import type { ConfiguracionSunat, ConfiguracionSunatValues } from "../types/sunat.types";

const mensaje = (error: unknown, defecto: string) => (error instanceof Error && error.message) || defecto;

/**
 * Configuración SUNAT de la vista Empresa. `version` cambia cuando se guardan los
 * datos de la empresa, para refrescar los «datos faltantes» que valida el backend.
 */
export function useConfiguracionSunat(habilitado: boolean, version: unknown) {
  const { toast } = useToast();
  const [configuracion, setConfiguracion] = useState<ConfiguracionSunat | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [probando, setProbando] = useState(false);

  useEffect(() => {
    if (!habilitado) return;
    let vigente = true;
    queueMicrotask(() => setCargando(true));
    obtenerConfiguracionSunat()
      .then((value) => { if (vigente) { setConfiguracion(value); setError(""); } })
      .catch((e) => { if (vigente) setError(mensaje(e, "No se pudo cargar la configuración SUNAT.")); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [habilitado, version]);

  const guardar = useCallback(async (values: ConfiguracionSunatValues) => {
    setGuardando(true);
    try {
      setConfiguracion(await guardarConfiguracionSunat(values));
      toast("success", "Configuración SUNAT guardada", "Las credenciales se guardaron cifradas.");
      return true;
    } catch (e) {
      toast("error", "No se pudo guardar", mensaje(e, "Revisa los datos e inténtalo nuevamente."));
      return false;
    } finally { setGuardando(false); }
  }, [toast]);

  const subirCertificado = useCallback(async (file: File, clave: string) => {
    setSubiendo(true);
    try {
      setConfiguracion(await subirCertificadoSunat(file, clave));
      toast("success", "Certificado cargado", "Se validó con su contraseña y se guardó cifrado.");
      return true;
    } catch (e) {
      toast("error", "No se pudo cargar el certificado", mensaje(e, "Verifica el archivo y su contraseña."));
      return false;
    } finally { setSubiendo(false); }
  }, [toast]);

  const probar = useCallback(async () => {
    setProbando(true);
    try {
      const r = await probarConexionSunat();
      toast("success", "Conexión correcta", r.mensaje);
    } catch (e) {
      toast("error", "La prueba falló", mensaje(e, "Revisa el token y los datos de la empresa."));
    } finally { setProbando(false); }
  }, [toast]);

  return { configuracion, cargando, error, guardando, subiendo, probando, guardar, subirCertificado, probar };
}
