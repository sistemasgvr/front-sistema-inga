"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { getMe } from "@/modules/auth/services/auth.service";
import { listSucursales } from "@/modules/mesas/services/mesas.service";
import { listEstaciones } from "@/modules/estaciones/services/estaciones.service";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { cambiarPreparacion,listarCocina } from "../services/cocina.service";
import type { CocinaItem,CocinaAccion } from "../types/cocina.types";
import { PermisoBanderas as P } from "@/shared/constants/permiso-banderas";

export function useCocina(){
  const [sucursal,setSucursal]=useState(0),[estacion,setEstacion]=useState(0),[historial,setHistorial]=useState(false);
  const [pagina,setPagina]=useState(1),[revision,setRevision]=useState(0);
  const [items,setItems]=useState<CocinaItem[]>([]),[total,setTotal]=useState(0);
  const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
  const [puedeEntregar,setPuedeEntregar]=useState(false),[puedeAnular,setPuedeAnular]=useState(false);
  const [preparacion,setPreparacion]=useState<{item:CocinaItem|null}|null>(null);
  const [accion,setAccion]=useState<{item:CocinaItem;tipo:CocinaAccion}|null>(null);
  const request=useRef<AbortController|null>(null);
  const sucursales=useLazyOptions(useCallback(()=>listSucursales(),[]));
  const estaciones=useLazyOptions(useCallback(async()=>sucursal?(await listEstaciones({pagina:1,limite:100,estado:"activos",id_sucursal:sucursal})).registros:[],[sucursal]));
  useEffect(()=>{let active=true;void getMe().then(u=>{if(active){setPuedeEntregar(!!(u?.es_super_admin||u?.permisos?.includes(P.PEDIDOS_ENTREGAR)));setPuedeAnular(!!(u?.es_super_admin||u?.permisos?.includes(P.PEDIDOS_ANULAR)));}}).catch(()=>{});return()=>{active=false;};},[]);
  const reload=useCallback(()=>setRevision(v=>v+1),[]);
  useEffect(()=>{
    request.current?.abort();const controller=new AbortController();request.current=controller;
    setItems([]);setTotal(0);setError("");setLoading(false);
    if(sucursal){setLoading(true);void listarCocina({id_sucursal:sucursal,id_estacion:estacion||undefined,historial,limite:20,offset:(pagina-1)*20},controller.signal)
      .then(r=>{if(!controller.signal.aborted){setItems(r.registros);setTotal(r.total);}})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"No se pudo consultar cocina.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});}
    return()=>controller.abort();
  },[sucursal,estacion,historial,pagina,revision]);
  useEffect(()=>{if(sucursal)void estaciones.load();},[sucursal,estaciones.load]);
  async function estado(item:CocinaItem,valor:3|4){
    if(saving)return;setSaving(true);setError("");
    try{await cambiarPreparacion(item,valor);reload();}catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar el plato.");}finally{setSaving(false);}
  }
  return {sucursal,estacion,historial,pagina,setPagina,revision,items,total,loading,saving,error,sucursales,estaciones,
    puedeEntregar,puedeAnular,preparacion,setPreparacion,accion,setAccion,estado,reload,
    cambiarSucursal:(id:number)=>{setSucursal(id);setEstacion(0);setPagina(1);reload();},
    cambiarEstacion:(id:number)=>{setEstacion(id);setPagina(1);reload();},
    cambiarHistorial:(value:boolean)=>{setHistorial(value);setPagina(1);reload();}};
}
