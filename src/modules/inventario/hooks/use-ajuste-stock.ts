"use client";
import { useCallback, useEffect, useState } from "react";
import { LISTA_IDS, obtenerOpcionesLista } from "@/modules/listas";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
export function useAjusteStock(open: boolean) {
 const tipos=useLazyOptions(useCallback((signal:AbortSignal)=>obtenerOpcionesLista(LISTA_IDS.ALM_TIPO_MOVIMIENTO,signal),[]));
 const [motivo,setMotivo]=useState("");
 const [signo,setSigno]=useState<1|-1>(1);
 const [cantidad,setCantidad]=useState(1);
  const [costoUnitario,setCostoUnitario]=useState<string>("");
 const [observacion,setObservacion]=useState("");
 const [error,setError]=useState<string|null>(null);
 const {load}=tipos;
 useEffect(()=>{if(open){void load();setMotivo("");setSigno(1);setCantidad(1);setCostoUnitario("");setObservacion("");setError(null);}},[open,load]);
 return {tipo:tipos.options.find(t=>t.codigo==='AJUSTE'),cargando:tipos.isLoading,error:error??tipos.error,setError,
 motivo,setMotivo,signo,setSigno,cantidad,setCantidad,costoUnitario,setCostoUnitario,observacion,setObservacion};
}
