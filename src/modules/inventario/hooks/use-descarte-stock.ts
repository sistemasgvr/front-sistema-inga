"use client";
import { useCallback, useEffect, useState } from "react";
import { LISTA_IDS, obtenerOpcionesLista } from "@/modules/listas";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { platosLibres } from "../utils/stock.utils";
import type { StockItem } from "../types/inventario.types";

// El modal monta el formulario con key por ítem: cada apertura empieza con el estado inicial.
export function useDescarteStock(item: StockItem) {
 const tipos=useLazyOptions(useCallback((signal:AbortSignal)=>obtenerOpcionesLista(LISTA_IDS.ALM_TIPO_MOVIMIENTO,signal),[]));
 const libres=platosLibres(item);
 const [motivo,setMotivo]=useState("");
 const [cantidad,setCantidad]=useState(()=>Math.min(1,libres));
 const [observacion,setObservacion]=useState("");
 const [error,setError]=useState<string|null>(null);
 const {load}=tipos;
 useEffect(()=>{void load();},[load]);
 const tipo=tipos.options.find(t=>t.codigo==='SALIDA');
 // Motivo por el que el botón está apagado, para no dejarlo sin explicación.
 const razon=!Number.isFinite(cantidad)||cantidad<=0?"Ingresa una cantidad mayor a cero."
  :cantidad>libres?`Solo hay ${libres} plato(s) libre(s) para descartar.`
  :!motivo?"Elige el motivo del descarte."
  :"";
 return {tipo,cargando:tipos.isLoading,error:error??tipos.error,setError,libres,razon,
 motivo,setMotivo,cantidad,setCantidad,observacion,setObservacion};
}
