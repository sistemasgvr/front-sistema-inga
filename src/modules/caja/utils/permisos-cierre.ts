/**
 * Quién puede cerrar una caja abierta: el cajero del turno o un administrador
 * (rol ADMIN o superadministrador), aunque no sea su turno. El backend aplica
 * la misma regla y responde 403; acá solo se decide qué mostrar.
 */

/** Código del rol administrador en auth_rol. */
export const CODIGO_ROL_ADMIN = "ADMIN";

type UsuarioCierre = {
  id: number;
  es_super_admin?: boolean;
  sesion?: { es_super_admin?: boolean };
  roles?: { codigo: string }[] | null;
};

type TurnoCierre = {
  id_cajero: number;
  nombre_cajero?: string | null;
};

export function esAdministrador(usuario: UsuarioCierre | null | undefined): boolean {
  return Boolean(
    usuario?.es_super_admin ||
      usuario?.sesion?.es_super_admin ||
      usuario?.roles?.some((rol) => rol.codigo === CODIGO_ROL_ADMIN),
  );
}

export function esCajeroDelTurno(
  turno: TurnoCierre | null | undefined,
  usuario: UsuarioCierre | null | undefined,
): boolean {
  return !!turno && !!usuario && Number(turno.id_cajero) === Number(usuario.id);
}

export function puedeCerrarTurno(
  turno: TurnoCierre | null | undefined,
  usuario: UsuarioCierre | null | undefined,
): boolean {
  return !!turno && (esCajeroDelTurno(turno, usuario) || esAdministrador(usuario));
}

/** Texto para quien no puede cerrar la caja; mismo mensaje que el 403 del backend. */
export function mensajeQuienPuedeCerrar(turno: TurnoCierre | null | undefined): string {
  const cajero = turno?.nombre_cajero?.trim() || "el cajero que la abrió";
  return `Solo ${cajero}, quien abrió esta caja, o un administrador puede cerrarla.`;
}
