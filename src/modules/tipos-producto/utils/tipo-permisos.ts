import type {
  ImpactoTipoProducto,
  PermisosTipoProducto,
} from "../types/tipos-producto.types";

export type PermisoTipoClave = keyof PermisosTipoProducto;

export const PERMISOS_TIPO: readonly { clave: PermisoTipoClave; etiqueta: string }[] = [
  { clave: "permite_venta", etiqueta: "Permite venta" },
  { clave: "requiere_receta", etiqueta: "Requiere receta" },
  { clave: "requiere_estacion", etiqueta: "Requiere estación" },
  { clave: "permite_stock_inicial", etiqueta: "Permite stock inicial" },
];

export function extraerPermisos(tipo: PermisosTipoProducto): PermisosTipoProducto {
  return {
    permite_venta: tipo.permite_venta,
    requiere_receta: tipo.requiere_receta,
    requiere_estacion: tipo.requiere_estacion,
    permite_stock_inicial: tipo.permite_stock_inicial,
  };
}

/** Un tipo con receta no admite stock inicial: sus existencias entran por preparación. */
export function cambiarPermiso(
  permisos: PermisosTipoProducto,
  clave: PermisoTipoClave,
  activo: boolean,
): PermisosTipoProducto {
  const siguiente = { ...permisos, [clave]: activo };
  if (siguiente.requiere_receta) siguiente.permite_stock_inicial = false;
  return siguiente;
}

export function hayCambios(a: PermisosTipoProducto, b: PermisosTipoProducto) {
  return PERMISOS_TIPO.some(({ clave }) => a[clave] !== b[clave]);
}

export function contarPermisos(permisos: PermisosTipoProducto) {
  return PERMISOS_TIPO.filter(({ clave }) => permisos[clave]).length;
}

/** Consecuencias del cambio sobre productos existentes, que no se modifican al guardar. */
export function avisosImpacto(
  antes: PermisosTipoProducto,
  despues: PermisosTipoProducto,
  impacto: ImpactoTipoProducto,
): string[] {
  const avisos: string[] = [];
  const { en_venta, sin_receta, sin_estacion } = impacto;
  if (antes.permite_venta && !despues.permite_venta && en_venta > 0) {
    avisos.push(
      en_venta === 1
        ? "1 producto en carta ya no se podrá vender."
        : `${en_venta} productos en carta ya no se podrán vender.`,
    );
  }
  if (!antes.requiere_receta && despues.requiere_receta && sin_receta > 0) {
    avisos.push(
      sin_receta === 1
        ? "1 producto sin receta no podrá consumirse en pedidos hasta tenerla."
        : `${sin_receta} productos sin receta no podrán consumirse en pedidos hasta tenerla.`,
    );
  }
  if (!antes.requiere_estacion && despues.requiere_estacion && sin_estacion > 0) {
    avisos.push(
      sin_estacion === 1
        ? "1 producto sin estación deberá tenerla asignada al editarse."
        : `${sin_estacion} productos sin estación deberán tenerla asignada al editarse.`,
    );
  }
  return avisos;
}
