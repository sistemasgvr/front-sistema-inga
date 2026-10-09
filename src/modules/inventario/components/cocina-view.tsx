"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import Pagination from "@/components/tables/Pagination";
import { useCocina } from "../hooks/use-cocina";
import { ESTADOS_PREPARACION } from "../utils/cocina.utils";
import { PreparacionModal } from "./preparacion-modal";
import { AccionCocinaModal } from "./accion-cocina-modal";
import { AvisosCocina } from "./avisos-cocina";

export function CocinaView(){
  const c=useCocina();
  return <div className="space-y-5"><PageBreadcrumb pageTitle="Cocina y preparaciones"/>
    <div className="grid gap-3 sm:grid-cols-3">
      <div><Label>Sucursal</Label><Select defaultValue={String(c.sucursal||"")} options={c.sucursales.options.map(s=>({value:String(s.id),label:s.nombre}))}
        onOpen={()=>void c.sucursales.load()} isLoading={c.sucursales.isLoading} loadError={c.sucursales.error} onChange={v=>c.cambiarSucursal(Number(v))}/></div>
      <div><Label>Estación</Label><Select defaultValue={String(c.estacion||"")} options={[{value:"",label:"Todas las estaciones"},...c.estaciones.options.map(s=>({value:String(s.id),label:s.nombre}))]}
        disabled={!c.sucursal} onOpen={()=>void c.estaciones.load()} isLoading={c.estaciones.isLoading} loadError={c.estaciones.error} onChange={v=>c.cambiarEstacion(Number(v))}/></div>
      <div><Label>Mostrar</Label><Select defaultValue={c.historial?"historial":"pendientes"} options={[{value:"pendientes",label:"Pendientes de entrega"},{value:"historial",label:"Entregados y cancelados"}]} onChange={v=>c.cambiarHistorial(v==="historial")}/></div>
    </div>
    <div className="flex flex-wrap gap-3"><Button disabled={!c.sucursal||c.saving} onClick={()=>c.setPreparacion({item:null})}>Preparación anticipada</Button>
      <Button variant="outline" disabled={!c.sucursal||c.loading} onClick={c.reload}>Actualizar pedidos</Button></div>
    {c.error&&<Alert variant="error" title="Cocina" message={c.error}/>}
    {!c.historial&&<AvisosCocina sucursal={c.sucursal} estacion={c.estacion} revision={c.revision}/>}
    {c.loading?<p role="status">Cargando pedidos…</p>:!c.sucursal?<p>Selecciona una sucursal.</p>:c.items.length===0?<p>No hay platos en esta vista.</p>:<div className="grid gap-4 lg:grid-cols-2">
      {c.items.map(item=><article key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/40">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Comanda #{item.numero_comanda}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${item.estado_preparacion===4?"bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400":item.estado_preparacion===3?"bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400":"bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current"/>{ESTADOS_PREPARACION[item.estado_preparacion]}
          </span>
        </div>
        <div className="flex-1 space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="min-w-0 break-words text-base font-bold leading-6 text-gray-900 dark:text-white">{item.nombre_producto}</h2>
            <p className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
              title={c.historial?"Cantidad solicitada en la comanda":"Cantidad pendiente de entrega en esta comanda"}>
              <span className="block text-[10px] font-bold tracking-wider">CANT:</span>
              <span className="block text-2xl font-extrabold leading-7 tabular-nums">{Number(c.historial?item.cantidad:item.cantidad_pendiente)}</span>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><dt className="text-xs text-gray-500 dark:text-gray-400">Destino</dt><dd className="mt-0.5 font-semibold text-gray-800 dark:text-gray-200">{item.codigo_mesa?`Mesa ${item.codigo_mesa}`:"Para llevar / delivery"}</dd></div>
            <div><dt className="text-xs text-gray-500 dark:text-gray-400">Pedido</dt><dd className="mt-0.5 font-semibold text-gray-800 dark:text-gray-200">{item.codigo_pedido}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-gray-500 dark:text-gray-400">Estación</dt><dd className="mt-0.5 text-gray-700 dark:text-gray-300">{item.estacion}</dd></div>
          </dl>
          {item.observacion&&<div className="rounded-lg border-l-2 border-amber-400 bg-amber-50 px-3 py-2 dark:bg-amber-950/30"><p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Nota del pedido</p><p className="mt-1 break-words text-sm text-gray-800 dark:text-gray-200">{item.observacion}</p></div>}
        </div>
        {!c.historial&&<div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
          {item.estado_preparacion===4&&<span className="mr-auto text-xs font-medium text-green-700 dark:text-green-400">Pendiente de entrega</span>}
          {!!item.id_receta&&Number(item.cantidad_pendiente)>Number(item.cantidad_reservada)&&<Button size="sm" disabled={c.saving} onClick={()=>c.setPreparacion({item})}>Iniciar preparación</Button>}
          {c.puedePreparar&&item.estado_preparacion!==4&&<Button size="sm" disabled={c.saving||Number(item.cantidad_reservada)<Number(item.cantidad_pendiente)} onClick={()=>void c.estado(item,4)}>Plato listo</Button>}
          {c.puedeAnular&&<Button size="sm" variant="outline" disabled={c.saving} onClick={()=>c.setAccion({item,tipo:"cancelar"})}>Cancelar plato</Button>}
        </div>}
      </article>)}
    </div>}
    <Pagination currentPage={c.pagina} pageSize={20} totalItems={c.total} totalPages={Math.max(1,Math.ceil(c.total/20))} onPageChange={c.setPagina}/>
    {c.preparacion&&<PreparacionModal sucursal={c.sucursal} item={c.preparacion.item} onClose={()=>c.setPreparacion(null)} onSaved={()=>{c.setPreparacion(null);c.reload();}}/>}
    {c.accion&&<AccionCocinaModal item={c.accion.item} tipo={c.accion.tipo} onClose={()=>c.setAccion(null)} onSaved={()=>{c.setAccion(null);c.reload();}}/>}
  </div>;
}
