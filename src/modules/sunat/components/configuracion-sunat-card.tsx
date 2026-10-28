"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { useConfiguracionSunat } from "../hooks/use-configuracion-sunat";
import type { PermisosSunat } from "../hooks/use-permisos-sunat";
import type { ConfiguracionSunatValues } from "../types/sunat.types";
import { AMBIENTE, fechaCorta } from "../utils/sunat";

type Props = {
  permisos: PermisosSunat;
  /** Sin empresa guardada no hay dónde colgar la configuración. */
  hayEmpresa: boolean;
  /** Cambia al guardar la empresa: vuelve a calcular los datos faltantes. */
  versionEmpresa: unknown;
};

const VACIO: ConfiguracionSunatValues = {
  tokenEmision: "",
  idAmbiente: 1,
  usuarioSol: "",
  claveSol: "",
  diasLimiteEnvioBoleta: 3,
  diasLimiteEnvioFactura: 7,
};

function Requisito({ listo, titulo, detalle }: { listo: boolean; titulo: string; detalle?: string | null }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icon
        name={listo ? "mdi:check-circle" : "mdi:alert-circle-outline"}
        size={18}
        className={listo ? "mt-0.5 text-success-500" : "mt-0.5 text-warning-500"}
      />
      <span>
        <span className="font-medium text-gray-800 dark:text-white/90">{titulo}</span>
        {detalle && <span className="block text-xs text-gray-500 dark:text-gray-400">{detalle}</span>}
      </span>
    </li>
  );
}

/**
 * Facturación electrónica en la vista Empresa: estado de los requisitos, token de
 * APIsPERU, ambiente, clave SOL, certificado y plazos de envío. Los secretos nunca
 * se muestran: los campos vacíos conservan el valor guardado.
 */
export function ConfiguracionSunatCard({ permisos, hayEmpresa, versionEmpresa }: Props) {
  const c = useConfiguracionSunat(permisos.verConfiguracion && hayEmpresa, versionEmpresa);
  const [values, setValues] = useState<ConfiguracionSunatValues>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof ConfiguracionSunatValues, string>>>({});
  const [certificado, setCertificado] = useState<File | null>(null);
  const [claveCertificado, setClaveCertificado] = useState("");
  const archivo = useRef<HTMLInputElement>(null);
  // Momento de apertura de la vista, para avisar si el certificado ya venció.
  const [ahora] = useState(() => Date.now());

  const config = c.configuracion;
  useEffect(() => {
    if (!config) return;
    queueMicrotask(() =>
      setValues((p) => ({
        ...p,
        tokenEmision: "",
        usuarioSol: "",
        claveSol: "",
        idAmbiente: config.idAmbiente,
        diasLimiteEnvioBoleta: config.diasLimiteEnvioBoleta,
        diasLimiteEnvioFactura: config.diasLimiteEnvioFactura,
      })),
    );
  }, [config]);

  if (!permisos.verConfiguracion) return null;

  const editable = permisos.editarConfiguracion && hayEmpresa && Boolean(config?.cifradoConfigurado);
  const bloqueado = !editable || c.guardando;
  const listoParaEmitir = Boolean(config?.tieneToken && !config.datosEmpresaFaltantes.length);
  const vencido = config?.certificadoVence ? Date.parse(config.certificadoVence) < ahora : false;

  async function guardar(event: FormEvent) {
    event.preventDefault();
    const next: typeof errores = {};
    const dias = (n: number) => Number.isInteger(n) && n >= 0 && n <= 30;
    if (!dias(values.diasLimiteEnvioBoleta)) next.diasLimiteEnvioBoleta = "Entre 0 y 30 días.";
    if (!dias(values.diasLimiteEnvioFactura)) next.diasLimiteEnvioFactura = "Entre 0 y 30 días.";
    if (!config?.tieneToken && !values.tokenEmision.trim()) next.tokenEmision = "Pega el token de la empresa en APIsPERU.";
    setErrores(next);
    if (Object.keys(next).length) return;
    await c.guardar(values);
  }

  async function subirCertificado() {
    if (!certificado || !claveCertificado) return;
    if (await c.subirCertificado(certificado, claveCertificado)) {
      setCertificado(null);
      setClaveCertificado("");
    }
  }

  return (
    <ComponentCard
      title="Facturación electrónica (SUNAT)"
      desc="Conexión con APIsPERU para enviar boletas y facturas. Crea la empresa en tu cuenta de APIsPERU y pega aquí su token."
    >
      {!hayEmpresa ? (
        <p className="text-sm text-gray-500">Primero guarda los datos de la empresa.</p>
      ) : c.cargando && !config ? (
        <p className="text-sm text-gray-500">Cargando configuración...</p>
      ) : c.error ? (
        <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{c.error}</p>
      ) : config && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Estado: qué falta para poder emitir. */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="sm" color={listoParaEmitir ? "success" : "warning"}>
                {listoParaEmitir ? "Listo para emitir" : "Configuración incompleta"}
              </Badge>
              <Badge size="sm" color={config.idAmbiente === 2 ? "error" : "info"}>
                {AMBIENTE[config.idAmbiente]}
              </Badge>
            </div>
            <ul className="space-y-2.5">
              <Requisito
                listo={!config.datosEmpresaFaltantes.length}
                titulo="Datos de la empresa"
                detalle={config.datosEmpresaFaltantes.length ? `Falta: ${config.datosEmpresaFaltantes.join(", ")}` : "RUC, razón social, dirección y distrito"}
              />
              <Requisito listo={config.tieneToken} titulo="Token de APIsPERU" detalle={config.tieneToken ? "Cargado (oculto)" : "Sin token: no se puede enviar a SUNAT"} />
              <Requisito
                listo={config.tieneUsuarioSol && config.tieneClaveSol}
                titulo="Usuario y clave SOL"
                detalle={config.usuarioSol ? `Usuario ${config.usuarioSol}` : "Opcional: APIsPERU ya los tiene"}
              />
              <Requisito
                listo={config.tieneCertificado && !vencido}
                titulo="Certificado digital"
                detalle={config.tieneCertificado
                  ? `${config.certificadoTitular ?? "Cargado"} · ${vencido ? "venció" : "vence"} ${fechaCorta(config.certificadoVence)}`
                  : "Opcional: respaldo del que está en APIsPERU"}
              />
            </ul>
            {!config.cifradoConfigurado && (
              <p className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                El servidor no tiene SUNAT_CRYPTO_KEY: no se pueden guardar credenciales hasta configurarla en su .env.
              </p>
            )}
            {config.idAmbiente === 2 && (
              <p className="rounded-lg bg-error-50 px-3 py-2 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">
                Producción: los comprobantes enviados tienen validez tributaria.
              </p>
            )}
            <Button size="sm" variant="outline" disabled={!config.tieneToken || c.probando} onClick={() => void c.probar()}
              title={config.tieneToken ? "Genera el XML de una boleta de prueba sin enviarla a SUNAT" : "Primero guarda el token"}
              startIcon={<Icon name="mdi:connection" size={18} />}>
              {c.probando ? "Probando..." : "Probar conexión"}
            </Button>
          </div>

          <div className="space-y-6">
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <Label>Ambiente</Label>
                <div role="radiogroup" aria-label="Ambiente SUNAT" className="grid max-w-sm grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                  {([1, 2] as const).map((valor) => (
                    <button key={valor} type="button" role="radio" aria-checked={values.idAmbiente === valor} disabled={bloqueado}
                      onClick={() => setValues((p) => ({ ...p, idAmbiente: valor }))}
                      className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${values.idAmbiente === valor
                        ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
                      {AMBIENTE[valor]}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Debe coincidir con el ambiente de la empresa en APIsPERU.</p>
              </div>

              <div>
                <Label htmlFor="sunat_token">Token de la empresa en APIsPERU {config.tieneToken ? "" : "*"}</Label>
                <Input id="sunat_token" type="password" value={values.tokenEmision} disabled={bloqueado} maxLength={4000}
                  placeholder={config.tieneToken ? "•••••••• (guardado) — escribe uno nuevo para reemplazarlo" : "Pega el token"}
                  onChange={(e) => setValues((p) => ({ ...p, tokenEmision: e.target.value }))}
                  error={Boolean(errores.tokenEmision)} hint={errores.tokenEmision} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sunat_usuario">Usuario SOL secundario</Label>
                  <Input id="sunat_usuario" value={values.usuarioSol} disabled={bloqueado} maxLength={50}
                    placeholder={config.usuarioSol ?? "20123456789USUARIO"}
                    onChange={(e) => setValues((p) => ({ ...p, usuarioSol: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <Label htmlFor="sunat_clave">Clave SOL</Label>
                  <Input id="sunat_clave" type="password" value={values.claveSol} disabled={bloqueado} maxLength={100}
                    placeholder={config.tieneClaveSol ? "•••••••• (guardada)" : "Clave del usuario secundario"}
                    onChange={(e) => setValues((p) => ({ ...p, claveSol: e.target.value }))} />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Plazo de envío a SUNAT</p>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Días desde la emisión. Mientras no venza, el envío es manual desde Ventas; al vencer, el sistema lo envía solo.
                </p>
                <div className="grid max-w-md grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sunat_dias_boleta">Boletas (días)</Label>
                    <Input id="sunat_dias_boleta" type="number" min="0" max="30" value={values.diasLimiteEnvioBoleta} disabled={bloqueado}
                      onChange={(e) => setValues((p) => ({ ...p, diasLimiteEnvioBoleta: Number(e.target.value) }))}
                      error={Boolean(errores.diasLimiteEnvioBoleta)} hint={errores.diasLimiteEnvioBoleta} />
                  </div>
                  <div>
                    <Label htmlFor="sunat_dias_factura">Facturas (días)</Label>
                    <Input id="sunat_dias_factura" type="number" min="0" max="30" value={values.diasLimiteEnvioFactura} disabled={bloqueado}
                      onChange={(e) => setValues((p) => ({ ...p, diasLimiteEnvioFactura: Number(e.target.value) }))}
                      error={Boolean(errores.diasLimiteEnvioFactura)} hint={errores.diasLimiteEnvioFactura} />
                  </div>
                </div>
              </div>

              {editable && (
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={c.guardando} startIcon={<Icon name="mdi:content-save-outline" size={18} />}>
                    {c.guardando ? "Guardando..." : "Guardar configuración"}
                  </Button>
                </div>
              )}
            </form>

            {editable && (
              <div className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Certificado digital (.pfx / .p12)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Se valida con su contraseña y se guarda cifrado. Se avisa su fecha de vencimiento.</p>
                </div>
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
                  <div>
                    <input ref={archivo} type="file" accept=".pfx,.p12,application/x-pkcs12" className="hidden"
                      onChange={(e) => { setCertificado(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                    <Button size="sm" variant="outline" className="w-full" disabled={c.subiendo} onClick={() => archivo.current?.click()}
                      startIcon={<Icon name="mdi:certificate-outline" size={18} />}>
                      {certificado ? certificado.name : "Elegir archivo"}
                    </Button>
                  </div>
                  <Input type="password" placeholder="Contraseña del certificado" value={claveCertificado} disabled={c.subiendo}
                    onChange={(e) => setClaveCertificado(e.target.value)} />
                  <Button size="sm" disabled={!certificado || !claveCertificado || c.subiendo} onClick={() => void subirCertificado()}
                    startIcon={<Icon name="mdi:upload" size={18} />}>
                    {c.subiendo ? "Validando..." : config.tieneCertificado ? "Reemplazar" : "Cargar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ComponentCard>
  );
}
