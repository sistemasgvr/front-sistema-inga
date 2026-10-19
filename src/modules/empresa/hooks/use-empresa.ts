"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import {
  eliminarLogoEmpresa,
  guardarEmpresa,
  obtenerEmpresa,
  subirLogoEmpresa,
} from "../services/empresa.service";
import type { Empresa, EmpresaFormValues } from "../types/empresa.types";

const mensaje = (error: unknown, defecto: string) => (error instanceof Error && error.message) || defecto;

export function useEmpresa() {
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [procesandoLogo, setProcesandoLogo] = useState(false);
  const [puedeEditar, setPuedeEditar] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    queueMicrotask(() => setPuedeEditar(Boolean(user?.es_super_admin || user?.permisos?.includes(PermisoBanderas.EMPRESA_EDITAR))));
    let vigente = true;
    obtenerEmpresa()
      .then((value) => { if (vigente) setEmpresa(value); })
      .catch((e) => { if (vigente) setError(mensaje(e, "No se pudieron cargar los datos de la empresa.")); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  async function guardar(values: EmpresaFormValues) {
    if (guardando) return;
    setGuardando(true);
    try {
      setEmpresa(await guardarEmpresa(values));
      toast("success", "Empresa actualizada", "Los tickets usarán estos datos desde la próxima impresión.");
    } catch (e) {
      toast("error", "No se pudo guardar", mensaje(e, "Revisa los datos e inténtalo nuevamente."));
    } finally { setGuardando(false); }
  }

  async function cambiarLogo(file: File) {
    if (procesandoLogo) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("error", "Logo demasiado grande", "La imagen no puede superar los 5 MB.");
      return;
    }
    setProcesandoLogo(true);
    try {
      setEmpresa(await subirLogoEmpresa(file));
      toast("success", "Logo actualizado", "Revisa la vista previa del ticket.");
    } catch (e) {
      toast("error", "No se pudo subir el logo", mensaje(e, "Usa un archivo JPG, PNG o WEBP válido."));
    } finally { setProcesandoLogo(false); }
  }

  async function quitarLogo() {
    if (procesandoLogo) return;
    setProcesandoLogo(true);
    try {
      setEmpresa(await eliminarLogoEmpresa());
      toast("success", "Logo eliminado", "Los tickets se imprimirán sin logo.");
    } catch (e) {
      toast("error", "No se pudo quitar el logo", mensaje(e, "Inténtalo nuevamente."));
    } finally { setProcesandoLogo(false); }
  }

  return { empresa, cargando, error, guardando, procesandoLogo, puedeEditar, guardar, cambiarLogo, quitarLogo };
}
