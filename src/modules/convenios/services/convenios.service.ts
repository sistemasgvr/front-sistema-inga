import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  type ToggleStatusResult,
} from "@/shared/api/api-client";
import type {
  CondicionPagoItem,
  ConvenioFormValues,
  ConvenioItem,
  ConveniosResumen,
  ListConveniosParams,
  ListConveniosResult,
} from "../types/convenios.types";

/**
 * Llamadas HTTP del módulo de convenios.
 *
 * Leo la respuesta directo del contrato del backend
 * (`{ success, message, data, meta }`), sin defensas ni formatos alternativos:
 * `apiGetPaginated` ya devuelve `data` y `meta` listos.
 */

export async function listConvenios(
  params: ListConveniosParams,
): Promise<ListConveniosResult> {
  const { data, meta } = await apiGetPaginated<ConvenioItem, ConveniosResumen>(
    "/convenios",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        estado: params.estado || "activos",
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

/**
 * Trae las condiciones de pago para el selector del formulario.
 * Son pocas y no cambian, así que la pantalla las carga una sola vez al abrir.
 */
export async function listCondicionesPago(): Promise<CondicionPagoItem[]> {
  const response = await apiGet<{ registros: CondicionPagoItem[] }>(
    "/convenios/condiciones-pago",
  );
  return response?.registros ?? [];
}

export async function createConvenio(
  values: ConvenioFormValues,
): Promise<ConvenioItem> {
  return apiPost<ConvenioItem>("/convenios", {
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    id_condicion_pago: values.id_condicion_pago,
    limite_credito: values.limite_credito,
    corte_quincenal: values.corte_quincenal,
  });
}

export async function updateConvenio(
  id: number,
  values: ConvenioFormValues,
): Promise<ConvenioItem> {
  return apiPatch<ConvenioItem>(`/convenios/${id}`, {
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    id_condicion_pago: values.id_condicion_pago,
    limite_credito: values.limite_credito,
    corte_quincenal: values.corte_quincenal,
  });
}

/**
 * Un solo botón para dar de baja y para reactivar: miro el estado actual y
 * llamo al endpoint que toca. Así la tabla no necesita dos acciones distintas.
 */
export async function toggleConvenioStatus(
  convenio: ConvenioItem,
): Promise<ToggleStatusResult> {
  if (convenio.estado === 1) {
    return apiDelete<ToggleStatusResult>(`/convenios/${convenio.id}`);
  }
  return apiPatch<ToggleStatusResult>(`/convenios/${convenio.id}/activar`);
}
