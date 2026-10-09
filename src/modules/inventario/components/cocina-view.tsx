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
import { unidadesSinPreparar } from "@/modules/mesas/utils/cancelacion.utils";

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
      {c.items.map(item=><article key={item.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex justify-between gap-3"><h2 className="font-semibold">{item.nombre_producto}</h2><span className="text-sm">{ESTADOS_PREPARACION[item.estado_preparacion]}</span></div>
        <p className="text-sm text-gray-500">{item.codigo_pedido} · {item.codigo_mesa?`Mesa ${item.codigo_mesa}`:"Para llevar / delivery"} · Comanda {item.numero_comanda} · {item.estacion}</p>
        {item.observacion&&<p>{item.observacion}</p>}
        <p className="text-sm">Solicitados: {item.cantidad} · Listos: {item.cantidad_reservada} · Por preparar: {unidadesSinPreparar(item)} · Entregados: {item.cantidad_entregada} · Cancelados: {item.cantidad_cancelada}</p>
        {!c.historial&&<div className="flex flex-wrap gap-2">
          {item.estado_preparacion===2&&<Button size="sm" variant="outline" disabled={c.saving} onClick={()=>void c.estado(item,3)}>Iniciar preparación</Button>}
          {!!item.id_receta&&Number(item.cantidad_pendiente)>Number(item.cantidad_reservada)&&<Button size="sm" disabled={c.saving} onClick={()=>c.setPreparacion({item})}>Preparar porciones</Button>}
          {item.estado_preparacion!==4&&<Button size="sm" variant="outline" disabled={c.saving} onClick={()=>void c.estado(item,4)}>Alistar stock disponible</Button>}
          {c.puedeEntregar&&<Button size="sm" disabled={c.saving} onClick={()=>c.setAccion({item,tipo:"entregar"})}>Entregar a mesa / cliente</Button>}
          {c.puedeAnular&&<Button size="sm" variant="outline" disabled={c.saving} onClick={()=>c.setAccion({item,tipo:"cancelar"})}>Cancelar cantidad</Button>}
        </div>}
      </article>)}
    </div>}
    <Pagination currentPage={c.pagina} pageSize={20} totalItems={c.total} totalPages={Math.max(1,Math.ceil(c.total/20))} onPageChange={c.setPagina}/>
    {c.preparacion&&<PreparacionModal sucursal={c.sucursal} item={c.preparacion.item} onClose={()=>c.setPreparacion(null)} onSaved={()=>{c.setPreparacion(null);c.reload();}}/>}
    {c.accion&&<AccionCocinaModal item={c.accion.item} tipo={c.accion.tipo} onClose={()=>c.setAccion(null)} onSaved={()=>{c.setAccion(null);c.reload();}}/>}
  </div>;
}
