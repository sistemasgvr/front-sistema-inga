"use client";
import { useCallback, useEffect } from "react";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { getUnidadesMedida } from "../services/productos.service";
import { listCategorias } from "../categorias/services/categorias.service";
import { listSubCategorias } from "../subcategorias/services/subcategorias.service";
import { listAlmacenes } from "@/modules/almacenes/services/almacenes.service";
import { listEstaciones } from "@/modules/estaciones/services/estaciones.service";
export function useProductoCatalogos(open:boolean,categoria:number|null) {
 const unidades=useLazyOptions(useCallback(async()=> (await getUnidadesMedida()).unidades,[]));
 const categorias=useLazyOptions(useCallback(async()=> (await listCategorias({pagina:1,limite:100,estado:'activos'})).registros,[]));
 const subcategorias=useLazyOptions(useCallback(async()=> categoria ? (await listSubCategorias({pagina:1,limite:100,estado:'activos',id_categoria:categoria})).registros : [],[categoria]));
 const almacenes=useLazyOptions(useCallback(async()=> (await listAlmacenes({pagina:1,limite:100,estado:'activos'})).registros,[]));
 const estaciones=useLazyOptions(useCallback(async()=> (await listEstaciones({pagina:1,limite:100,estado:'activos'})).registros,[]));
 const {load:loadSub}=subcategorias;
 useEffect(()=>{if(open)void loadSub();},[open,categoria,loadSub]);
 return {unidades,categorias,subcategorias,almacenes,estaciones};
}
