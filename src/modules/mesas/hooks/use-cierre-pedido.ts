"use client";
import { useCallback, useState } from 'react';
import { useLazyOptions } from '@/shared/hooks/use-lazy-options';
import { listEstaciones } from '@/modules/estaciones/services/estaciones.service';
import { listConvenios } from '@/modules/convenios/services/convenios.service';
import { createPersona } from '@/modules/personas/services/personas.service';
import type { PersonaFormValues } from '@/modules/personas/types/personas.types';
import { useLista, LISTA_IDS } from '@/modules/listas';
import { useBuscarClientes } from './use-buscar-clientes';

/** Valor del catálogo MEDIO_PAGO reservado al flujo de crédito (tiene su propio botón). */
export const MEDIO_PAGO_CREDITO=4;

export function useCierrePedido(sucursal:number){
  // El cobro y la precuenta se hacen en el propio resumen; solo el crédito abre un formulario.
  const [creditoAbierto,setCreditoAbierto]=useState(false);
  const [documento,setDocumento]=useState('');
  const [efectivoConfirmado,setEfectivoConfirmado]=useState(false);
  const [tipo,setTipo]=useState('1');
  const [medio,setMedio]=useState('');
  const [documentoCobro,setDocumentoCobro]=useState('');
  const [estacion,setEstacion]=useState('');
  const [nuevo,setNuevo]=useState(false),[guardando,setGuardando]=useState(false);
  const busqueda=useBuscarClientes(documento);
  const cliente=busqueda.clientes.find(c=>c.num_documento===documento&&c.tipo_documento===1);
  const listaMedios=useLista(LISTA_IDS.MEDIO_PAGO);
  const medios=listaMedios.opciones.filter(o=>o.valor_entero!==null&&o.valor_entero!==MEDIO_PAGO_CREDITO&&o.codigo!=='CREDITO');
  const estaciones=useLazyOptions(useCallback(async()=>
    (await listEstaciones({id_sucursal:sucursal,estado:'activos',pagina:1,limite:100})).registros.filter(e=>e.impresora_ip),[sucursal]));
  const convenios=useLazyOptions(useCallback(async()=>(await listConvenios({estado:'activos',pagina:1,limite:100})).registros,[]));
  async function crear(values:PersonaFormValues){
    setGuardando(true);
    try{const persona=await createPersona({...values,es_cliente:true});setDocumento(persona.num_documento??'');setNuevo(false);}
    finally{setGuardando(false);}
  }
  /** Al cambiar de comprobante se limpia el documento: DNI y RUC tienen longitudes distintas. */
  const cambiarTipo=(valor:string)=>{setTipo(valor);setDocumentoCobro('');};
  const reiniciarCobro=()=>{setMedio('');setDocumentoCobro('');};
  /** Cada apertura empieza limpia: sin DNI previo ni confirmación de efectivo marcada. */
  const abrirCredito=()=>{setDocumento('');setEfectivoConfirmado(false);setCreditoAbierto(true);};
  return {efectivoConfirmado,setEfectivoConfirmado,creditoAbierto,abrirCredito,cerrarCredito:()=>setCreditoAbierto(false),documento,setDocumento,tipo,setTipo:cambiarTipo,medio,setMedio,
    documentoCobro,setDocumentoCobro,reiniciarCobro,medios,mediosCargando:listaMedios.isLoading,mediosError:listaMedios.error,recargarMedios:listaMedios.recargar,
    estacion,setEstacion,nuevo,
    abrirCliente:()=>{void convenios.load();setNuevo(true);},cerrarCliente:()=>setNuevo(false),guardando,crear,convenios,estaciones,cliente,busqueda};
}
