"use client";
import { useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { anularItem } from "@/modules/mesas/services/mesas.service";
import { repartoCancelacion } from "@/modules/mesas/utils/cancelacion.utils";
import { entregarItem } from "../services/cocina.service";
import type { CocinaAccion,CocinaItem } from "../types/cocina.types";

export function useAccionCocina(item:CocinaItem,tipo:CocinaAccion,onSaved:()=>void){
  const [cantidad,setCantidad]=useState(tipo==="entregar"?Math.min(Number(item.cantidad_pendiente),Number(item.cantidad_reservada)):Number(item.cantidad_pendiente));
  const [motivo,setMotivo]=useState(""),[destino,setDestino]=useState(""),[destinoInsumos,setDestinoInsumos]=useState("");
  const [saving,setSaving]=useState(false),[error,setError]=useState("");
  const reparto=repartoCancelacion(item,cantidad);
  async function guardar(){
    if(saving||!valido)return;
    setSaving(true);setError("");
    try{
      if(tipo==="entregar")await entregarItem(item,Number(item.cantidad_entregada)+cantidad);
      else{
        const usuario=getStoredUser();if(!usuario)throw new Error("Inicie sesión para cancelar.");
        await anularItem(item.id_pedido,item.id,{id_usuario_autoriza:usuario.id,motivo,cantidad_cancelada:Number(item.cantidad_cancelada)+cantidad,
          destino_preparado:reparto.pideDestinoPreparado&&destino?(destino as "DISPONIBLE"|"MERMA"):undefined,
          destino_insumos:reparto.pideDestinoInsumos&&destinoInsumos?(destinoInsumos as "LIBERAR"|"MERMA"):undefined});
      }
      onSaved();
    }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar.");}finally{setSaving(false);}
  }
  const valido=Number.isFinite(cantidad)&&cantidad>0&&cantidad<=Number(item.cantidad_pendiente)&&(tipo==="entregar"
    ?cantidad<=Number(item.cantidad_reservada)
    :!!motivo.trim()&&(!reparto.pideDestinoPreparado||!!destino)&&(!reparto.pideDestinoInsumos||!!destinoInsumos));
  return {cantidad,setCantidad,motivo,setMotivo,destino,setDestino,destinoInsumos,setDestinoInsumos,reparto,saving,error,guardar,valido};
}
