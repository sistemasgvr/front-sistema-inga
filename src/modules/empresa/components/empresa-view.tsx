"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { Combobox } from "@/components/form/Combobox";
import { ConfiguracionSunatCard, usePermisosSunat } from "@/modules/sunat";
import { useEmpresa } from "../hooks/use-empresa";
import { useDistritos } from "../hooks/use-distritos";
import type { EmpresaFormValues } from "../types/empresa.types";

const VACIO: EmpresaFormValues = { ruc: "", razonSocial: "", nombreComercial: "", direccion: "", idDistrito: null, tasaIgv: "18" };

const nombreDistrito = (d: { distrito: string; provincia: string; departamento: string }) =>
  `${d.distrito} - ${d.provincia} - ${d.departamento}`;

export function EmpresaView() {
  const { empresa, cargando, error, guardando, procesandoLogo, puedeEditar, guardar, cambiarLogo, quitarLogo } = useEmpresa();
  const [values, setValues] = useState<EmpresaFormValues>(VACIO);
  const [errors, setErrors] = useState<Partial<Record<keyof EmpresaFormValues, string>>>({});
  const archivo = useRef<HTMLInputElement>(null);
  const permisosSunat = usePermisosSunat();
  const [buscandoDistrito, setBuscandoDistrito] = useState(false);
  const distritos = useDistritos(buscandoDistrito);

  useEffect(() => {
    if (!empresa) return;
    queueMicrotask(() => setValues({
      ruc: empresa.ruc,
      razonSocial: empresa.razonSocial,
      nombreComercial: empresa.nombreComercial ?? "",
      direccion: empresa.direccion ?? "",
      idDistrito: empresa.idDistrito,
      tasaIgv: String(empresa.tasaIgv ?? 18),
    }));
  }, [empresa]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!/^\d{11}$/.test(values.ruc.trim())) next.ruc = "El RUC debe tener 11 dígitos.";
    if (!values.razonSocial.trim()) next.razonSocial = "La razón social es obligatoria.";
    const tasa = Number(values.tasaIgv);
    if (values.tasaIgv.trim() === "" || !Number.isFinite(tasa) || tasa < 0 || tasa > 100) next.tasaIgv = "Ingresa un porcentaje entre 0 y 100.";
    setErrors(next);
    if (Object.keys(next).length) return;
    await guardar(values);
  }

  const bloqueado = cargando || guardando || !puedeEditar;

  return (
    <div>
      <PageBreadcrumb pageTitle="Empresa" />
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{error}</p>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ComponentCard title="Datos de la empresa" desc="Aparecen en los comprobantes impresos y se informan a SUNAT como emisor.">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <Label htmlFor="empresa_ruc">RUC *</Label>
                <Input id="empresa_ruc" value={values.ruc} maxLength={11} placeholder="20123456789"
                  onChange={(e) => setValues((p) => ({ ...p, ruc: e.target.value.replace(/\D/g, "") }))}
                  error={Boolean(errors.ruc)} hint={errors.ruc} disabled={bloqueado} />
              </div>
              <div>
                <Label htmlFor="empresa_razon">Razón social *</Label>
                <Input id="empresa_razon" value={values.razonSocial} maxLength={255} placeholder="RESTAURANTE INGA S.A.C."
                  onChange={(e) => setValues((p) => ({ ...p, razonSocial: e.target.value }))}
                  error={Boolean(errors.razonSocial)} hint={errors.razonSocial} disabled={bloqueado} />
              </div>
            </div>
            <div>
              <Label htmlFor="empresa_comercial">Nombre comercial</Label>
              <Input id="empresa_comercial" value={values.nombreComercial} maxLength={255} placeholder="INGA"
                onChange={(e) => setValues((p) => ({ ...p, nombreComercial: e.target.value }))} disabled={bloqueado} />
            </div>
            <div>
              <Label htmlFor="empresa_direccion">Dirección fiscal</Label>
              <Input id="empresa_direccion" value={values.direccion} maxLength={300} placeholder="Av. Principal 123 - Lima"
                onChange={(e) => setValues((p) => ({ ...p, direccion: e.target.value }))} disabled={bloqueado} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <Label>Distrito del domicilio fiscal</Label>
                <Combobox
                  placeholder="Buscar distrito"
                  searchPlaceholder="Distrito, provincia o ubigeo..."
                  loadingText="Buscando distritos..."
                  defaultValue={values.idDistrito ? String(values.idDistrito) : ""}
                  disabled={bloqueado}
                  isLoading={distritos.cargando}
                  hint={distritos.error ?? "Su ubigeo es obligatorio para emitir boletas y facturas."}
                  error={Boolean(distritos.error)}
                  onOpen={() => setBuscandoDistrito(true)}
                  onSearchChange={distritos.setTermino}
                  onChange={(valor) => setValues((p) => ({ ...p, idDistrito: valor ? Number(valor) : null }))}
                  options={[
                    // El distrito guardado siempre figura, aunque no esté en la búsqueda actual.
                    ...(empresa?.distrito && !distritos.distritos.some((d) => d.id === empresa.distrito!.id) ? [empresa.distrito] : []),
                    ...distritos.distritos,
                  ].map((d) => ({ value: String(d.id), label: nombreDistrito(d), sublabel: d.ubigeo ? `Ubigeo ${d.ubigeo}` : undefined }))}
                />
              </div>
              <div>
                <Label htmlFor="empresa_igv">Tasa de IGV (%) *</Label>
                <Input id="empresa_igv" type="number" min="0" max="100" step={0.01} value={values.tasaIgv} disabled={bloqueado}
                  onChange={(e) => setValues((p) => ({ ...p, tasaIgv: e.target.value }))}
                  error={Boolean(errors.tasaIgv)} hint={errors.tasaIgv ?? "Según el régimen vigente. Aplica a los pedidos nuevos."} />
              </div>
            </div>
            {puedeEditar && (
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={cargando || guardando}
                  startIcon={<Icon name="mdi:content-save-outline" size={18} />}>
                  {guardando ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            )}
          </form>
        </ComponentCard>

        <ComponentCard title="Logo" desc="Se imprime centrado en comandas, precuentas y comprobantes.">
          <div className="space-y-4">
            <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
              {empresa?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={empresa.logoUrl} alt="Logo de la empresa" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm text-gray-400">
                  <Icon name="mdi:image-outline" size={32} />
                  Sin logo
                </span>
              )}
            </div>

            {empresa?.logoTicket && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Así sale en el ticket</p>
                <div className="mx-auto w-[220px] rounded-md bg-white px-4 py-3 shadow-theme-xs ring-1 ring-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={empresa.logoTicket} alt="Vista del logo en el ticket" className="mx-auto max-h-20 max-w-full [image-rendering:pixelated]" />
                  <div className="mt-2 border-t border-dashed border-gray-300 pt-2 text-center font-mono text-[10px] leading-tight text-gray-800">
                    <p className="font-bold">{values.razonSocial || "RAZON SOCIAL"}</p>
                    <p>RUC {values.ruc || "-----------"}</p>
                  </div>
                </div>
              </div>
            )}

            {puedeEditar && (
              <div className="flex flex-wrap gap-2">
                <input ref={archivo} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void cambiarLogo(file); }} />
                <Button size="sm" disabled={!empresa || procesandoLogo} onClick={() => archivo.current?.click()}
                  title={empresa ? undefined : "Primero guarda los datos de la empresa"}
                  startIcon={<Icon name="mdi:upload" size={18} />}>
                  {procesandoLogo ? "Procesando…" : empresa?.logoUrl ? "Cambiar logo" : "Subir logo"}
                </Button>
                {empresa?.logoUrl && (
                  <Button size="sm" variant="outline" disabled={procesandoLogo} onClick={() => void quitarLogo()}
                    startIcon={<Icon name="mdi:trash-can-outline" size={18} />}>
                    Quitar
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG o WEBP hasta 5 MB. Funciona mejor un logo horizontal con fondo blanco o transparente: la
              impresora térmica lo imprime en blanco y negro.
            </p>
          </div>
        </ComponentCard>
      </div>

      <div className="mt-6">
        <ConfiguracionSunatCard permisos={permisosSunat} hayEmpresa={Boolean(empresa)} versionEmpresa={empresa} />
      </div>
    </div>
  );
}
