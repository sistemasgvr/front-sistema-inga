"use client";
import { FormModal } from "@/components/ui/modal/FormModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import { useAccionCocina } from "../hooks/use-accion-cocina";
import type { CocinaItem,CocinaAccion } from "../types/cocina.types";

export function AccionCocinaModal({item,tipo,onClose,onSaved}:{item:CocinaItem;tipo:CocinaAccion;onClose:()=>void;onSaved:()=>void}){
  const a=useAccionCocina(item,tipo,onSaved);
  return <FormModal isOpen onClose={()=>{if(!a.saving)onClose();}} title={`${tipo==="entregar"?"Entregar":"Cancelar"}: ${item.nombre_producto}`}
    isSaving={a.saving} submitDisabled={!a.valido} onSubmit={e=>{e.preventDefault();void a.guardar();}}>
    {a.error&&<Alert variant="error" title="No se pudo guardar" message={a.error}/>}
    <p className="text-sm text-gray-500">Pendientes: {item.cantidad_pendiente}. Entregados: {item.cantidad_entregada}. Cancelados: {item.cantidad_cancelada}.</p>
    <Label>Cantidad que se {tipo==="entregar"?"entrega":"cancela"} ahora</Label><Input type="number" min="0.0001" max={String(item.cantidad_pendiente)} step={0.0001} value={a.cantidad} disabled={a.saving} onChange={e=>a.setCantidad(Number(e.target.value))}/>
    {tipo==="cancelar"&&<>
      <Label>Motivo de cancelación</Label><Input value={a.motivo} disabled={a.saving} onChange={e=>a.setMotivo(e.target.value)}/>
      {a.reparto.sinPreparar>0&&!a.reparto.pideDestinoInsumos&&<p className="text-sm text-gray-500">
        {a.reparto.sinPreparar} sin preparar: sus ingredientes apartados vuelven al almacén.</p>}
      {a.reparto.pideDestinoInsumos&&<><Label>Ingredientes de {a.reparto.sinPreparar} en preparación</Label><Select defaultValue={a.destinoInsumos} onChange={a.setDestinoInsumos} disabled={a.saving}
        options={[{value:"LIBERAR",label:"No se usaron: devolver al almacén"},{value:"MERMA",label:"Ya se usaron: registrar merma"}]}/></>}
      {a.reparto.pideDestinoPreparado&&<><Label>{a.reparto.preparados} ya preparados</Label><Select defaultValue={a.destino} onChange={a.setDestino} disabled={a.saving}
        options={[{value:"DISPONIBLE",label:"Guardar en inventario para revender"},{value:"MERMA",label:"Descartar y registrar merma"}]}/>
        <p className="text-sm text-gray-500">Los ingredientes de los platos preparados no se devuelven al almacén.</p></>}
    </>}
  </FormModal>;
}
