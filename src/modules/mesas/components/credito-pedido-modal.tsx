"use client";
import { useState, type FormEvent } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Checkbox from '@/components/form/input/Checkbox';
import Alert from '@/components/ui/alert/Alert';
import { Icon } from '@/components/ui/icon';
import { FormModal } from '@/components/ui/modal/FormModal';
import { nivelCredito } from '@/modules/cuentas-por-cobrar/utils/formato';
import type { PersonaBusquedaItem } from '@/modules/personas';
import type { Feedback } from '../types/mesas.types';

const soles=(n:number)=>`S/ ${n.toFixed(2)}`;

type CreditoPedidoModalProps={
  isOpen:boolean;
  total:number;
  saving:boolean;
  feedback:Feedback|null;
  documento:string;
  onDocumento:(valor:string)=>void;
  cliente:PersonaBusquedaItem|undefined;
  buscando:boolean;
  errorBusqueda:string|null;
  efectivoConfirmado:boolean;
  onEfectivoConfirmado:(valor:boolean)=>void;
  onRegistrarCliente:()=>void;
  onClose:()=>void;
  onSubmit:()=>void;
};

export function CreditoPedidoModal({isOpen,total,saving,feedback,documento,onDocumento,cliente,buscando,errorBusqueda,
  efectivoConfirmado,onEfectivoConfirmado,onRegistrarCliente,onClose,onSubmit}:CreditoPedidoModalProps){
  const [tocado,setTocado]=useState(false);
  const [enviado,setEnviado]=useState(false);

  // El límite del convenio es el techo de la DEUDA, no del cobro: a crédito entra solo lo
  // que le falta al cliente para llegar al tope; el resto de la venta va en efectivo.
  // Un límite de 0 NO es "crédito cero": es SIN TOPE, la cuenta de consorcio que se
  // liquida a fin de período, así que entra el pedido completo. Reutilizo nivelCredito
  // para que este modal y las tablas de CxC no se separen. Mismo criterio que
  // ven_pedido_cobrar.sql.
  const limite=Number(cliente?.limite_credito??0),deuda=Number(cliente?.saldo_credito??0);
  const sinTope=nivelCredito(deuda,limite).nivel==='sin-tope';
  const disponible=sinTope?total:Math.max(0,limite-deuda);
  const aCredito=Math.min(total,disponible);
  const excedente=total-aCredito;
  const usoLinea=sinTope?0:Math.min(100,Math.round(deuda/limite*100));
  const tieneConvenio=!!cliente?.id_convenio;

  const dniCompleto=/^\d{8}$/.test(documento);
  const errorDni=!documento?'Ingresa el DNI del cliente.':!dniCompleto?'El DNI debe tener 8 dígitos.':undefined;
  const mostrarErrorDni=(tocado||enviado)&&errorDni;
  const noEncontrado=dniCompleto&&!buscando&&!errorBusqueda&&!cliente;
  const valido=dniCompleto&&tieneConvenio&&(excedente===0||efectivoConfirmado);

  function handleSubmit(e:FormEvent){
    e.preventDefault();
    setEnviado(true);
    if(saving||!valido)return;
    onSubmit();
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} isSaving={saving} submitDisabled={!valido}
      title="Venta a crédito" subtitle={`Registra el pedido en la cuenta del convenio del cliente. Total del pedido: ${soles(total)}.`}
      submitText={aCredito===0&&tieneConvenio?'Registrar pago en efectivo':'Registrar crédito'}>
      {feedback?.variant==='error'&&<Alert variant="error" title="No se pudo registrar" message={feedback.message}/>}

      <div>
        <Label htmlFor="credito_dni">DNI del cliente *</Label>
        <Input id="credito_dni" value={documento} maxLength={8} placeholder="45612345" disabled={saving}
          onChange={e=>onDocumento(e.target.value.replace(/\D/g,'').slice(0,8))}
          onBlur={()=>setTocado(true)}
          error={Boolean(mostrarErrorDni)}
          hint={mostrarErrorDni?errorDni:buscando?'Buscando cliente…':`${documento.length}/8 dígitos`}/>
      </div>

      {errorBusqueda&&<Alert variant="error" title="No se pudo buscar el cliente" message={errorBusqueda}/>}

      {noEncontrado&&<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 p-5 text-center dark:border-gray-700">
        <Icon name="mdi:account-search-outline" size={28} className="text-gray-400"/>
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">No hay un cliente registrado con el DNI {documento}</p>
        <p className="text-xs text-gray-500">Regístralo y asígnale un convenio para poder venderle a crédito.</p>
        <button type="button" onClick={onRegistrarCliente} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
          <Icon name="mdi:account-plus-outline" size={18}/>Registrar cliente
        </button>
      </div>}

      {cliente&&<>
        {/* Ficha del cliente: quién es, a qué convenio pertenece y cuánto crédito le queda. */}
        <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Icon name="mdi:account" size={22}/>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{cliente.nombre_completo}</p>
              <p className="text-xs text-gray-500">DNI {cliente.num_documento}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tieneConvenio
              ?'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
              :'border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
              {tieneConvenio?`Convenio ${cliente.nombre_convenio}`:'Sin convenio'}
            </span>
          </div>
          {tieneConvenio&&<div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <dl className="grid grid-cols-3 gap-3">
              <div><dt className="text-xs text-gray-500">Límite de crédito</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{sinTope?'Sin tope':soles(limite)}</dd></div>
              <div><dt className="text-xs text-gray-500">Deuda actual</dt><dd className="mt-0.5 text-sm font-semibold text-error-600">{soles(deuda)}</dd></div>
              <div><dt className="text-xs text-gray-500">Disponible</dt>
                <dd className={`mt-0.5 text-sm font-semibold ${sinTope?'text-success-600':disponible>0?'text-success-600':'text-gray-400'}`}>{sinTope?'Ilimitado':soles(disponible)}</dd></div>
            </dl>
            {sinTope
              ?<p className="mt-3 text-xs text-gray-500">Su convenio no tiene tope: el pedido completo pasa a la cuenta por cobrar.</p>
              :<div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" role="progressbar" aria-valuenow={usoLinea} aria-valuemin={0} aria-valuemax={100} aria-label="Uso del crédito">
                  <div className={`h-full rounded-full ${usoLinea>=100?'bg-error-500':usoLinea>=80?'bg-warning-500':'bg-success-500'}`} style={{width:`${usoLinea}%`}}/>
                </div>
                <p className="mt-1 text-xs text-gray-500">{usoLinea>=100?'Llegó al límite de su crédito.':`Usa el ${usoLinea}% de su crédito.`}</p>
              </div>}
          </div>}
        </section>

        {!tieneConvenio
          ?<Alert variant="error" title="No puede comprar a crédito" message="El cliente necesita un convenio activo. Asígnale uno desde Clientes o cobra el pedido normalmente."/>
          :<>
            {/* Cómo se reparte el total entre la cuenta por cobrar y el efectivo. */}
            <section>
              <Label>Cómo se registrará el pedido</Label>
              <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Icon name="mdi:account-credit-card-outline" size={18} className="text-blue-500"/>A crédito (cuenta por cobrar)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{soles(aCredito)}</span>
                </div>
                {excedente>0&&<div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Icon name="mdi:cash" size={18} className="text-success-500"/>En efectivo ahora</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{soles(excedente)}</span>
                </div>}
                <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800/60">
                  <span className="font-semibold text-gray-900 dark:text-white">Total del pedido</span>
                  <span className="font-bold text-brand-600">{soles(total)}</span>
                </div>
              </div>
            </section>

            {excedente>0&&<div className="space-y-3 rounded-xl border border-warning-300 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/10">
              <p className="text-sm text-warning-800 dark:text-warning-300">
                {aCredito===0
                  ?`El cliente no tiene crédito disponible. Todo el pedido (${soles(excedente)}) debe pagarse en efectivo.`
                  :`El crédito disponible no cubre todo el pedido. Cobra ${soles(excedente)} en efectivo.`}
              </p>
              <Checkbox id="credito_efectivo" checked={efectivoConfirmado} onChange={onEfectivoConfirmado} disabled={saving}
                label={`Confirmo que recibí ${soles(excedente)} en efectivo`}/>
            </div>}
          </>}
      </>}
    </FormModal>
  );
}
