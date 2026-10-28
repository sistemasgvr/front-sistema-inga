"use client";

import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Icon } from "@/components/ui/icon";
import { useEstadoPersistente } from "@/shared/hooks/use-estado-persistente";
import { usePermisosSunat } from "../hooks/use-permisos-sunat";
import { BandejaTab } from "./bandeja-tab";
import { LotesTab } from "./lotes-tab";
import { ResumenDiaTab } from "./resumen-dia-tab";

type Pestana = "dia" | "bandeja" | "lotes";

const PESTANAS: { id: Pestana; titulo: string; icono: string; ayuda: string }[] = [
  { id: "dia", titulo: "Resumen del día", icono: "mdi:calendar-check-outline", ayuda: "Comprobantes de un día y envío masivo" },
  { id: "bandeja", titulo: "Pendientes y rechazados", icono: "mdi:inbox-arrow-up-outline", ayuda: "Lo que falta enviar, ordenado por fecha límite" },
  { id: "lotes", titulo: "Resúmenes y bajas", icono: "mdi:file-multiple-outline", ayuda: "Resúmenes diarios de boletas y bajas de facturas" },
];

/** Comprobantes electrónicos: envío a SUNAT, seguimiento de estados y descargas. */
export function SunatView() {
  const permisos = usePermisosSunat();
  const [pestana, setPestana] = useEstadoPersistente<Pestana>("sunat.pestana", "dia");

  return (
    <div>
      <PageBreadcrumb pageTitle="Comprobantes SUNAT" />
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Las boletas y facturas quedan pendientes al cobrar y se imprimen igual. Puedes enviarlas aquí o desde Ventas;
          al llegar su fecha límite el sistema las envía solo.
        </p>
        {permisos.verConfiguracion && (
          <Link href="/configuracion/empresa"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            <Icon name="mdi:cog-outline" size={16} />
            Configuración SUNAT
          </Link>
        )}
      </div>

      <div role="tablist" aria-label="Secciones SUNAT" className="mb-5 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id} title={p.ayuda}
            onClick={() => setPestana(p.id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${pestana === p.id
              ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
            <Icon name={p.icono} size={18} />
            {p.titulo}
          </button>
        ))}
      </div>

      {pestana === "dia" && <ResumenDiaTab permisos={permisos} />}
      {pestana === "bandeja" && <BandejaTab permisos={permisos} />}
      {pestana === "lotes" && <LotesTab permisos={permisos} />}
    </div>
  );
}
