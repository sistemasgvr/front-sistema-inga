"use client";
import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { Icon } from '@/components/ui/icon';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/components/ui/toast/ToastContext';
import { PersonaFormModal } from '@/modules/personas/components/persona-form-modal';
import { useCierrePedido } from '../hooks/use-cierre-pedido';
import { CreditoPedidoModal } from './credito-pedido-modal';
import type { Pedido, Feedback } from '../types/mesas.types';

export type CierrePedidoDatos={id_estacion?:number;tipo_comprobante?:number;medio_pago?:number;documento?:string;efectivo_confirmado?:boolean};

/** Valores de tipo_comprobante aceptados por ven_pedido_cobrar: 1 boleta, 2 factura, 3 nota de venta. */
const COMPROBANTES=[
  {value:'1',label:'Boleta'},
  {value:'2',label:'Factura'},
  {value:'3',label:'Sin documento'},
] as const;

const ICONO_MEDIO:Record<string,string>={EFECTIVO:'mdi:cash',YAPE:'mdi:cellphone',PLIN:'mdi:cellphone',TARJETA:'mdi:credit-card-outline',TRANSFERENCIA:'mdi:bank-transfer'};

export function CierrePedido({pedido,saving,feedback,onConfirmar}:{pedido:Pedido;saving:boolean;feedback:Feedback|null;
  onConfirmar:(accion:'precuenta'|'cobrar'|'credito',datos:CierrePedidoDatos)=>Promise<boolean>}){
  const f=useCierrePedido(pedido.id_sucursal);
  const {toast}=useToast();
  const [aperturasCredito,setAperturasCredito]=useState(0);
  const esFactura=f.tipo==='2',sinDocumento=f.tipo==='3';
  const documentoValido=esFactura?/^\d{11}$/.test(f.documentoCobro):f.tipo==='1'?f.documentoCobro===''||/^\d{8}$/.test(f.documentoCobro):true;
  const cobroValido=!!f.medio&&documentoValido;
  const sinItems=pedido.items.every(i=>i.tipo_linea===3);
  const total=Number(pedido.monto_total);

  async function enviarPrecuenta(){
    if(saving)return;
    if(await onConfirmar('precuenta',{}))
      toast('success','Precuenta enviada',`Se imprimirá en la estación de caja de la sucursal. El pedido ${pedido.codigo} queda por cobrar.`);
  }

  async function cobrar(){
    if(!cobroValido||saving)return;
    const ok=await onConfirmar('cobrar',{tipo_comprobante:Number(f.tipo),medio_pago:Number(f.medio),documento:sinDocumento?'':f.documentoCobro});
    if(ok)f.reiniciarCobro();
  }

  return <>
    <div className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-800">
      {/* Comprobante */}
      <div role="radiogroup" aria-label="Tipo de comprobante" className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {COMPROBANTES.map(c=>{const activo=f.tipo===c.value;return(
          <button key={c.value} type="button" role="radio" aria-checked={activo} disabled={saving} onClick={()=>f.setTipo(c.value)}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${activo
              ?'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white'
              :'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{c.label}</button>);})}
      </div>

      {!sinDocumento&&<div>
        <Input value={f.documentoCobro} disabled={saving} maxLength={esFactura?11:8}
          placeholder={esFactura?'RUC del cliente (11 dígitos) *':'DNI del cliente (opcional)'}
          error={f.documentoCobro!==''&&!documentoValido}
          hint={f.documentoCobro!==''&&!documentoValido?(esFactura?'El RUC debe tener 11 dígitos.':'El DNI debe tener 8 dígitos.'):undefined}
          onChange={e=>f.setDocumentoCobro(e.target.value.replace(/\D/g,''))}/>
      </div>}

      {/* Medios de pago (el crédito tiene su propio flujo) */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-500">Medio de pago</p>
        {f.mediosError?<button type="button" onClick={f.recargarMedios} className="text-xs font-semibold text-brand-600 underline">No se pudieron cargar los medios de pago. Reintentar</button>
        :f.mediosCargando?<p role="status" className="text-xs text-gray-400">Cargando medios de pago…</p>
        :<div role="radiogroup" aria-label="Medio de pago" className="grid grid-cols-3 gap-2">
          {f.medios.map(m=>{const valor=String(m.valor_entero),activo=f.medio===valor;return(
            <button key={m.id} type="button" role="radio" aria-checked={activo} disabled={saving} onClick={()=>f.setMedio(valor)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition disabled:opacity-50 ${activo
                ?'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                :'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'}`}>
              <Icon name={ICONO_MEDIO[m.codigo]??'mdi:wallet-outline'} size={20}/>
              <span className="w-full truncate text-center">{m.nombre}</span>
            </button>);})}
        </div>}
      </div>

      <Button className="w-full" disabled={saving||!cobroValido||sinItems} onClick={()=>void cobrar()}
        startIcon={<Icon name="mdi:cash-register" size={18}/>}>
        Cobrar S/ {Number(pedido.monto_total).toFixed(2)}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" disabled={saving} onClick={()=>void enviarPrecuenta()} startIcon={<Icon name="mdi:receipt-text-outline" size={16}/>}>Precuenta</Button>
        <Button size="sm" variant="outline" disabled={saving} onClick={()=>{setAperturasCredito(n=>n+1);f.abrirCredito();}} startIcon={<Icon name="mdi:account-credit-card-outline" size={16}/>}>Crédito</Button>
      </div>
    </div>

    <CreditoPedidoModal key={aperturasCredito} isOpen={f.creditoAbierto} total={total} saving={saving} feedback={feedback}
      documento={f.documento} onDocumento={f.setDocumento} cliente={f.cliente} buscando={f.busqueda.isLoading} errorBusqueda={f.busqueda.error}
      efectivoConfirmado={f.efectivoConfirmado} onEfectivoConfirmado={f.setEfectivoConfirmado} onRegistrarCliente={f.abrirCliente}
      onClose={()=>{if(!saving)f.cerrarCredito();}}
      onSubmit={async()=>{if(await onConfirmar('credito',{documento:f.documento,efectivo_confirmado:f.efectivoConfirmado}))f.cerrarCredito();}}/>
    <PersonaFormModal isOpen={f.nuevo} onClose={f.cerrarCliente} onSubmit={f.crear} persona={null} convenios={f.convenios.options} isSaving={f.guardando}/>
  </>;
}
