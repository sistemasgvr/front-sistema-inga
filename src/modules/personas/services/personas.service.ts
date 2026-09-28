import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  type ToggleStatusResult,
} from "@/shared/api/api-client";
import type {
  ListPersonasParams,
  ListPersonasResult,
  PersonaBusquedaItem,
  PersonaFormValues,
  PersonaItem,
  PersonaRolFilter,
  PersonasResumen,
} from "../types/personas.types";

export async function listPersonas(
  params: ListPersonasParams,
): Promise<ListPersonasResult> {
  const { data, meta } = await apiGetPaginated<PersonaItem, PersonasResumen>(
    "/personas",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        estado: params.estado || "activos",
        rol: params.rol || "todos",
        id_convenio: params.id_convenio || undefined,
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export async function getPersonaById(id: number): Promise<PersonaItem> {
  return apiGet<PersonaItem>(`/personas/${id}`);
}

/**
 * Buscador rápido para autocompletar.
 *
 * Lo dejo exportado desde acá para que las pantallas de compras (M07) y de
 * cobro a crédito (M12) lo reutilicen en vez de escribir su propia búsqueda.
 * El parámetro `rol` es importante: en compras se pide 'proveedores' y en
 * cobros 'clientes', para que el cajero no pueda elegir a la persona equivocada.
 */
export async function buscarPersonas(
  busqueda: string,
  rol: PersonaRolFilter = "todos",
  limite = 15,
  signal?: AbortSignal,
): Promise<PersonaBusquedaItem[]> {
  const response = await apiGet<{ registros: PersonaBusquedaItem[] }>(
    "/personas/buscar",
    { params: { buscar: busqueda || undefined, rol, limite }, signal },
  );
  return response?.registros ?? [];
}

export type ClienteRapidoValues = {
  nombres: string;
  apellido_paterno: string;
  /** DNI opcional: si viene vacío la persona se crea sin documento. */
  dni?: string;
  telefono?: string;
  direccion?: string;
};

/** Alta rápida de un cliente (persona natural) desde la toma de pedidos. */
export async function crearClienteRapido(values: ClienteRapidoValues): Promise<PersonaItem> {
  const dni = values.dni?.trim();
  return apiPost<PersonaItem>("/personas", {
    tipo_persona: 1,
    ...(dni ? { tipo_documento: 1, num_documento: dni } : {}),
    nombres: values.nombres.trim(),
    apellido_paterno: values.apellido_paterno.trim(),
    telefono: values.telefono?.trim() || undefined,
    direccion: values.direccion?.trim() || undefined,
    es_cliente: true,
  });
}

/**
 * Arma el cuerpo del request a partir del formulario.
 *
 * Mando `null` en los campos vacíos en lugar de cadenas vacías porque la base
 * distingue las dos cosas: `null` es "sin dato" y `''` sería un dato en blanco.
 */
function construirPayload(values: PersonaFormValues) {
  return {
    tipo_persona: values.tipo_persona,
    tipo_documento: values.tipo_documento,
    num_documento: values.num_documento.trim(),
    razon_social: values.razon_social.trim() || undefined,
    nombres: values.nombres.trim() || undefined,
    apellido_paterno: values.apellido_paterno.trim() || undefined,
    apellido_materno: values.apellido_materno.trim() || undefined,
    direccion: values.direccion.trim() || undefined,
    telefono: values.telefono.trim() || undefined,
    email: values.email.trim().toLowerCase() || undefined,
    es_cliente: values.es_cliente,
    es_proveedor: values.es_proveedor,
    id_convenio: values.id_convenio ?? undefined,
  };
}

export async function createPersona(
  values: PersonaFormValues,
): Promise<PersonaItem> {
  return apiPost<PersonaItem>("/personas", construirPayload(values));
}

export async function updatePersona(
  id: number,
  values: PersonaFormValues,
): Promise<PersonaItem> {
  return apiPatch<PersonaItem>(`/personas/${id}`, {
    ...construirPayload(values),
    // Si el formulario dejó el convenio en blanco, tengo que decirlo de forma
    // explícita: mandar id_convenio vacío significa "no lo cambies", no
    // "quítalo". Esta bandera es la que permite desasignar de verdad.
    quitar_convenio: values.id_convenio === null,
  });
}

export async function togglePersonaStatus(
  persona: PersonaItem,
): Promise<ToggleStatusResult> {
  if (persona.estado === 1) {
    return apiDelete<ToggleStatusResult>(`/personas/${persona.id}`);
  }
  return apiPatch<ToggleStatusResult>(`/personas/${persona.id}/activar`);
}
