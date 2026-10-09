"use client";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAvisosCocina } from "../hooks/use-avisos-cocina";

const hora=(fecha:string)=>new Date(fecha).toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit",timeZone:"America/Lima"});

export function AvisosCocina({sucursal,estacion,revision}:{sucursal:number;estacion:number;revision:number}){
  const a=useAvisosCocina(sucursal,estacion,revision);
  if(!a.avisos.length&&!a.error)return null;
  return <section aria-label="Comandas rechazadas por falta de stock" className="space-y-3">
    {a.error&&<Alert variant="error" title="Avisos de cocina" message={a.error}/>}
    {a.avisos.map(aviso=><article key={aviso.id} role="alert" className="rounded-xl border border-error-300 bg-error-50 p-4 dark:border-error-500/40 dark:bg-error-500/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-error-700 dark:text-error-400">Comanda rechazada por falta de stock</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">{aviso.codigo_pedido} · {aviso.codigo_mesa?`Mesa ${aviso.codigo_mesa}`:"Para llevar / delivery"} · {hora(aviso.fecha_modificacion)}{aviso.usuario?` · ${aviso.usuario}`:""}</p>
        </div>
        <Button size="sm" variant="outline" disabled={!!a.atendiendo} onClick={()=>void a.atender(aviso.id)}>{a.atendiendo===aviso.id?"Guardando…":"Atendido"}</Button>
      </div>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-gray-800 dark:text-gray-200">
        {aviso.faltantes.map(f=><li key={f.id_producto}><strong>{f.producto}</strong>: faltan {Number(f.faltante)} {f.unidad} (hay {Number(f.disponible)}) · {f.platos.join(", ")}</li>)}
      </ul>
    </article>)}
  </section>;
}
