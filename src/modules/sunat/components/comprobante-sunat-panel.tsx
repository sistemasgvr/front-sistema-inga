"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { obtenerHistorialSunat } from "../services/sunat.service";
import type { PermisosSunat } from "../hooks/use-permisos-sunat";
import type { useAccionesSunat } from "../hooks/use-acciones-sunat";
import type { EstadoSunat, HistorialSunat } from "../types/sunat.types";
import { DIAS_MAXIMOS_BAJA, ESTADO_SUNAT, diasDesde, esElectronico, textoVencimiento } from "../utils/sunat";
import { BajaSunatModal } from "./baja-sunat-modal";
import { EstadoSunatBadge } from "./estado-sunat-badge";

/** Datos SUNAT que ya trae el comprobante en el detalle de la venta. */
export interface ComprobanteSunatResumen {
  id: number;
  numero: string;
  tipo_comprobante: number;
  fecha_emision: string;
  /** 1 vigente, 0 reemplazado al reemitir. */
  estado: number;
  estado_sunat?: EstadoSunat | null;
  sunat_mensaje?: string | null;
  codigo_respuesta_sunat?: string | null;
  observaciones_sunat?: string | null;
  fecha_limite_envio?: string | null;
  fecha_envio_sunat?: string | null;
  forma_envio?: 1 | 2 | null;
  tiene_xml?: boolean;
  tiene_cdr?: boolean;
}

type Props = {
  comprobante: ComprobanteSunatResumen;
  permisos: PermisosSunat;
  acciones: ReturnType<typeof useAccionesSunat>;
  /** Versión reducida para los comprobantes anulados. */
  compacto?: boolean;
};

const OPERACION: Record<string, string> = {
  ENVIO: "Envío",
  CONSULTA_CDR: "Consulta de CDR",
  RESUMEN: "Resumen diario",
  BAJA: "Comunicación de baja",
  CONSULTA_TICKET: "Respuesta de SUNAT",
};

/**
 * Estado SUNAT de un comprobante con sus acciones. Cada botón aparece solo cuando
 * aplica a su estado y el usuario tiene el permiso:
 * - Enviar: pendiente y vigente (sunat.crear).
 * - Consultar CDR: facturas ya enviadas (sunat.crear).
 * - XML / CDR / PDF A4: descargas (sunat.listar).
 * - Dar de baja: aceptado y reemplazado al reemitir, hasta 7 días (sunat.eliminar).
 */
export function ComprobanteSunatPanel({ comprobante: c, permisos, acciones, compacto = false }: Props) {
  const [historial, setHistorial] = useState<HistorialSunat[] | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [bajaAbierta, setBajaAbierta] = useState(false);

  if (!esElectronico(c.tipo_comprobante) || !permisos.listar) return null;

  const estado = (c.estado_sunat ?? 1) as EstadoSunat;
  const ocupado = Boolean(acciones.procesando);
  const boton = (accion: string) => acciones.procesando === `${accion}-${c.id}`;
  const vence = estado === 1 && c.estado === 1 ? textoVencimiento(c.fecha_limite_envio) : null;
  const puedeEnviar = permisos.enviar && estado === 1 && c.estado === 1;
  const puedeConsultar = permisos.enviar && c.tipo_comprobante === 2 && (estado === 2 || estado === 5) && c.forma_envio === 1;
  const dentroPlazoBaja = diasDesde(c.fecha_emision) <= DIAS_MAXIMOS_BAJA;
  const puedeBaja = permisos.darDeBaja && estado === 2 && c.estado === 0;
  const hayCdr = Boolean(c.tiene_cdr) || (estado === 2 && c.forma_envio === 2);

  async function verHistorial() {
    if (historial) { setHistorial(null); return; }
    setCargandoHistorial(true);
    try { setHistorial(await obtenerHistorialSunat(c.id)); }
    catch { setHistorial([]); }
    finally { setCargandoHistorial(false); }
  }

  return (
    <div className={compacto ? "mt-1" : "mt-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-white/[0.02]"}>
      <div className="flex flex-wrap items-center gap-2">
        <EstadoSunatBadge estado={estado} />
        {c.forma_envio === 2 && <span className="text-xs text-gray-500">vía resumen diario</span>}
        {c.codigo_respuesta_sunat && <span className="text-xs text-gray-400">Código {c.codigo_respuesta_sunat}</span>}
        {vence && (
          <span className={`text-xs font-medium ${vence.startsWith("Vence en") ? "text-gray-500" : "text-warning-600 dark:text-warning-400"}`}>
            {vence}
          </span>
        )}
      </div>
      {!compacto && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{c.sunat_mensaje || ESTADO_SUNAT[estado].ayuda}</p>
      )}
      {!compacto && c.observaciones_sunat && (
        <p className="mt-1 whitespace-pre-line text-xs text-warning-700 dark:text-warning-400">Observaciones: {c.observaciones_sunat}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        {puedeEnviar && (
          <Button size="sm" disabled={ocupado} onClick={() => void acciones.enviar(c.id)}
            startIcon={<Icon name="mdi:send-outline" size={16} />}>
            {boton("enviar") ? "Enviando..." : "Enviar a SUNAT"}
          </Button>
        )}
        {puedeConsultar && (
          <Button size="sm" variant="outline" disabled={ocupado} onClick={() => void acciones.consultar(c.id)}
            startIcon={<Icon name="mdi:cloud-search-outline" size={16} />}>
            {boton("consultar") ? "Consultando..." : "Consultar CDR"}
          </Button>
        )}
        {estado !== 0 && (
          <>
            <Button size="sm" variant="outline" disabled={ocupado} onClick={() => void acciones.descargar(c.id, "xml", c.numero)}
              title={estado === 1 ? "XML firmado de vista previa: aún no se envió a SUNAT" : "XML firmado"}
              startIcon={<Icon name="mdi:xml" size={16} />}>
              {boton("xml") ? "Generando..." : "XML"}
            </Button>
            {hayCdr && (
              <Button size="sm" variant="outline" disabled={ocupado} onClick={() => void acciones.descargar(c.id, "cdr", c.numero)}
                title="Constancia de recepción de SUNAT (ZIP)" startIcon={<Icon name="mdi:folder-zip-outline" size={16} />}>
                {boton("cdr") ? "Descargando..." : "CDR"}
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={ocupado} onClick={() => void acciones.descargar(c.id, "pdf-a4", c.numero)}
              title="Representación impresa en hoja A4" startIcon={<Icon name="mdi:file-document-outline" size={16} />}>
              {boton("pdf-a4") ? "Generando..." : "PDF A4"}
            </Button>
          </>
        )}
        {puedeBaja && (
          <Button size="sm" variant="outline" disabled={ocupado || !dentroPlazoBaja} onClick={() => setBajaAbierta(true)}
            title={dentroPlazoBaja ? "Anular en SUNAT el comprobante reemplazado" : "Pasaron más de 7 días: requiere nota de crédito"}
            startIcon={<Icon name="mdi:file-cancel-outline" size={16} />}>
            Dar de baja en SUNAT
          </Button>
        )}
        {!compacto && (
          <button type="button" onClick={() => void verHistorial()}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
            <Icon name="mdi:history" size={14} />
            {cargandoHistorial ? "Cargando..." : historial ? "Ocultar historial" : "Historial SUNAT"}
          </button>
        )}
      </div>

      {historial && (
        <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-xs dark:border-gray-800">
          {historial.length === 0 ? (
            <li className="text-gray-400">Sin envíos registrados.</li>
          ) : historial.map((h) => (
            <li key={h.id} className="flex gap-2">
              <Icon name={h.exito ? "mdi:check" : "mdi:close"} size={14} className={h.exito ? "text-success-500" : "text-error-500"} />
              <span className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{OPERACION[h.operacion] ?? h.operacion}</span>
                {" · "}{new Date(h.fecha_creacion).toLocaleString("es-PE", { timeZone: "America/Lima" })}
                {h.mensaje ? ` · ${h.mensaje}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <BajaSunatModal
        isOpen={bajaAbierta}
        numero={c.numero}
        tipoComprobante={c.tipo_comprobante}
        enviando={boton("baja")}
        onClose={() => setBajaAbierta(false)}
        onConfirmar={(motivo) => acciones.darDeBaja(c.id, motivo)}
      />
    </div>
  );
}
