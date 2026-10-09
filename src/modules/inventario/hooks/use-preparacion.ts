"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { confirmarPreparacion, disponibilidadPreparacion, listarPreparables } from "../services/cocina.service";
import type { CocinaItem, Disponibilidad, PreparacionValues } from "../types/cocina.types";

export function usePreparacion(sucursal:number,item:CocinaItem|null,onSaved:()=>void) {
  const productos=useLazyOptions(useCallback((signal:AbortSignal)=>listarPreparables(sucursal,signal),[sucursal]));
  const [producto,setProducto]=useState("");
  const [cantidad,setCantidad]=useState(item ? Math.max(0,Number(item.cantidad_pendiente)-Number(item.cantidad_reservada)):1);
  const [disponibilidad,setDisponibilidad]=useState<Disponibilidad|null>(null);
  const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
  const [revision,setRevision]=useState(0);
  const operacion=useRef<{key:string;codigo:string}|null>(null);
  const elegido=productos.options.find(p=>String(p.id)===producto);
  const receta=Number(item?.id_receta??elegido?.id_receta??0);
  const almacen=Number(item?.id_almacen_stock??elegido?.id_almacen_stock??0);
  useEffect(()=>{void productos.load();},[productos.load]);
  useEffect(()=>{
    const controller=new AbortController();
    setDisponibilidad(null);setError("");setLoading(false);
    if(receta && almacen && cantidad>0){
      setLoading(true);
      void disponibilidadPreparacion({codigo:"",id_receta:receta,id_almacen_destino:almacen,cantidad,id_pedido_detalle:item?.id},controller.signal)
        .then(r=>{if(!controller.signal.aborted)setDisponibilidad(r);})
        .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"No se pudo consultar disponibilidad.");})
        .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    }
    return ()=>controller.abort();
  },[receta,almacen,cantidad,item?.id,revision]);
  async function guardar(){
    if(saving||!disponibilidad||loading)return;
    setSaving(true);setError("");
    const data={id_receta:receta,id_almacen_destino:almacen,cantidad,id_pedido_detalle:item?.id};
    const key=JSON.stringify(data);
    if(operacion.current?.key!==key)operacion.current={key,codigo:`PREP-${crypto.randomUUID()}`};
    try {await confirmarPreparacion({...data,codigo:operacion.current.codigo} satisfies PreparacionValues);onSaved();}
    catch(e){setError(e instanceof Error?e.message:"No se pudo registrar la preparación.");}
    finally{setSaving(false);}
  }
  return {productos,producto,cambiarProducto:(id:string)=>{setProducto(id);setRevision(v=>v+1);},cantidad,setCantidad,
    disponibilidad,loading,saving,error,guardar,almacen:elegido?.almacen,
    puedeGuardar:!!disponibilidad&&!loading&&cantidad>0&&disponibilidad.ingredientes.every(i=>Number(i.faltante)===0)};
}
