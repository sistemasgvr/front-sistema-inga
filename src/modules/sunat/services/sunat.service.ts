import {
  apiGet,
  apiGetBlob,
  apiGetPaginated,
  apiPost,
  apiPut,
} from "@/shared/api/api-client";
import type {
  BandejaItem,
  ComprobanteSunat,
  ConfiguracionSunat,
  ConfiguracionSunatValues,
  HistorialSunat,
  LoteSunat,
  ResultadoEnvioDia,
  ResumenDia,
} from "../types/sunat.types";
import { guardarArchivo } from "../utils/sunat";

// Configuración (vista Empresa)

export const obtenerConfiguracionSunat = () =>
  apiGet<ConfiguracionSunat>("/general/empresa/sunat");

/** Los campos secretos vacíos no se envían: el backend conserva los actuales. */
export const guardarConfiguracionSunat = (values: ConfiguracionSunatValues) =>
  apiPut<ConfiguracionSunat>("/general/empresa/sunat", {
    tokenEmision: values.tokenEmision.trim() || undefined,
    idAmbiente: values.idAmbiente,
    usuarioSol: values.usuarioSol.trim() || undefined,
    claveSol: values.claveSol || undefined,
    diasLimiteEnvioBoleta: values.diasLimiteEnvioBoleta,
    diasLimiteEnvioFactura: values.diasLimiteEnvioFactura,
  });

export function subirCertificadoSunat(file: File, clave: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("clave", clave);
  return apiPost<ConfiguracionSunat>("/general/empresa/sunat/certificado", formData);
}

export const probarConexionSunat = () =>
  apiPost<{ ok: boolean; mensaje: string }>("/general/empresa/sunat/probar");

// Comprobantes

export const obtenerEstadoSunat = (id: number) =>
  apiGet<ComprobanteSunat>(`/sunat/comprobantes/${id}`);

export const obtenerHistorialSunat = (id: number) =>
  apiGet<HistorialSunat[]>(`/sunat/comprobantes/${id}/historial`);

export const enviarComprobanteSunat = (id: number) =>
  apiPost<ComprobanteSunat>(`/sunat/comprobantes/${id}/enviar`);

export const consultarComprobanteSunat = (id: number) =>
  apiPost<ComprobanteSunat>(`/sunat/comprobantes/${id}/consultar`);

export const darDeBajaSunat = (id: number, motivo: string) =>
  apiPost<LoteSunat[]>(`/sunat/comprobantes/${id}/baja`, { motivo: motivo.trim() });

export type ArchivoComprobante = "xml" | "cdr" | "pdf-a4";

const EXTENSION: Record<ArchivoComprobante, { ext: string; tipo: string }> = {
  xml: { ext: "xml", tipo: "application/xml" },
  cdr: { ext: "zip", tipo: "application/zip" },
  "pdf-a4": { ext: "pdf", tipo: "application/pdf" },
};

export async function descargarArchivoSunat(id: number, archivo: ArchivoComprobante, numero: string) {
  const { ext, tipo } = EXTENSION[archivo];
  const prefijo = archivo === "cdr" ? "R-" : "";
  const sufijo = archivo === "pdf-a4" ? "-A4" : "";
  guardarArchivo(
    await apiGetBlob(`/sunat/comprobantes/${id}/${archivo}`),
    `${prefijo}${numero.replace(/[^\w-]+/g, "_")}${sufijo}.${ext}`,
    tipo,
  );
}

// Bandeja y resumen del día

export async function listarBandejaSunat(
  params: { estado_sunat?: number; tipo_comprobante?: number; pagina: number; limite: number },
  signal?: AbortSignal,
) {
  const { data, meta } = await apiGetPaginated<BandejaItem>("/sunat/pendientes", { params, signal });
  return { registros: data, total: meta.total };
}

export const obtenerResumenDia = (fecha: string, signal?: AbortSignal) =>
  apiGet<ResumenDia>("/sunat/resumen-dia", { params: { fecha }, signal });

export const enviarDiaSunat = (fecha: string) =>
  apiPost<ResultadoEnvioDia>("/sunat/resumen-dia/enviar", { fecha });

// Lotes (resúmenes y bajas)

export async function listarLotesSunat(
  params: { fecha?: string; tipo_lote?: number; pagina: number; limite: number },
  signal?: AbortSignal,
) {
  const { data, meta } = await apiGetPaginated<LoteSunat>("/sunat/lotes", {
    params: { ...params, fecha: params.fecha || undefined },
    signal,
  });
  return { registros: data, total: meta.total };
}

export const obtenerLoteSunat = (id: number) => apiGet<LoteSunat>(`/sunat/lotes/${id}`);

export const consultarLoteSunat = (id: number) => apiPost<LoteSunat>(`/sunat/lotes/${id}/consultar`);

export async function descargarArchivoLote(lote: Pick<LoteSunat, "id" | "identificador">, archivo: "xml" | "cdr") {
  guardarArchivo(
    await apiGetBlob(`/sunat/lotes/${lote.id}/${archivo}`),
    archivo === "xml" ? `${lote.identificador}.xml` : `R-${lote.identificador}.zip`,
    archivo === "xml" ? "application/xml" : "application/zip",
  );
}
