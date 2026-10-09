"use client";
import { useCallback,useEffect,useState } from "react";
import { atenderAvisoCocina,listarAvisosCocina } from "../services/cocina.service";
import type { AvisoCocina } from "../types/cocina.types";

// La cocina no tiene canal en tiempo real: se consulta al cambiar filtros, al actualizar y cada 20 s.
const INTERVALO_MS=20000;

export function useAvisosCocina(sucursal:number,estacion:number,revision:number){
  const clave=`${sucursal}:${estacion}`;
  // Cada respuesta queda asociada a su filtro: nunca se muestran avisos de otra sucursal o estación.
  const [resultado,setResultado]=useState<{clave:string;avisos:AvisoCocina[];error:string}>({clave:"",avisos:[],error:""});
  const [errorAccion,setErrorAccion]=useState(""),[atendiendo,setAtendiendo]=useState(0);
  const [tick,setTick]=useState(0);
  const recargar=useCallback(()=>setTick(v=>v+1),[]);
  useEffect(()=>{
    if(!sucursal)return;
    const controller=new AbortController();
    void listarAvisosCocina({id_sucursal:sucursal,id_estacion:estacion||undefined},controller.signal)
      .then(avisos=>{if(!controller.signal.aborted)setResultado({clave,avisos,error:""});})
      .catch(e=>{if(!controller.signal.aborted)setResultado({clave,avisos:[],error:e instanceof Error?e.message:"No se pudieron consultar los avisos."});});
    return()=>controller.abort();
  },[sucursal,estacion,clave,revision,tick]);
  useEffect(()=>{
    if(!sucursal)return;
    const timer=setInterval(recargar,INTERVALO_MS);
    return()=>clearInterval(timer);
  },[sucursal,recargar]);
  async function atender(id:number){
    if(atendiendo)return;setAtendiendo(id);setErrorAccion("");
    try{await atenderAvisoCocina(id);recargar();}catch(e){setErrorAccion(e instanceof Error?e.message:"No se pudo marcar el aviso.");}finally{setAtendiendo(0);}
  }
  const vigente=sucursal>0&&resultado.clave===clave;
  return {avisos:vigente?resultado.avisos:[],error:errorAccion||(vigente?resultado.error:""),atendiendo,atender};
}
