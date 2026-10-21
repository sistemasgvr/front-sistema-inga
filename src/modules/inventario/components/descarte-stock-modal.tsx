"use client";

import { ToastNotification } from "@/components/ui/toast/ToastNotification";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { ListaSelect, LISTA_IDS } from "@/modules/listas";
import { useDescarteStock } from "../hooks/use-descarte-stock";
import { MOTIVOS_DESCARTE } from "../utils/stock.utils";
import type { StockItem, RegistrarMovimientoValues } from "../types/inventario.types";
type Props={isOpen:boolean;onClose:()=>void;onSubmit:(v:RegistrarMovimientoValues)=>Promise<void>;stockItem:StockItem|null;isSaving:boolean};
// Baja de platos preparados con anticipación que no están asignados a ningún pedido. Preparar es tarea de
// cocina; aquí solo se decide descartarlos (merma) o conservarlos cerrando el modal sin guardar.
export function DescarteStockModal({isOpen,stockItem,...props}:Props){
 if(!isOpen||!stockItem)return null;
 return <DescarteStockForm key={stockItem.id} stockItem={stockItem} {...props}/>;
}

function DescarteStockForm({onClose,onSubmit,stockItem,isSaving}:Omit<Props,'isOpen'|'stockItem'>&{stockItem:StockItem}){
 const f=useDescarteStock(stockItem);
 const reservados=Number(stockItem.stock_reservado??0);
 return <FormModal isOpen onClose={onClose} title="Descartar platos libres" subtitle={stockItem.producto_nombre}
 submitText="Descartar" cancelText="Conservar" isSaving={isSaving} submitDisabled={!!f.razon||!f.tipo||f.cargando} onSubmit={async e=>{
 e.preventDefault();if(isSaving||f.razon||!f.tipo)return;
 try{await onSubmit({codigo:'DESC-'+crypto.randomUUID(),id_tipo_movimiento:f.tipo.id,id_motivo_movimiento:Number(f.motivo),
 id_almacen:stockItem.id_almacen,id_producto:stockItem.id_producto,id_unidad_medida:stockItem.id_unidad_medida,
 cantidad:f.cantidad,signo:-1,costo_unitario:Number(stockItem.costo_promedio),observacion:f.observacion,confirmar:true});}
 catch(e){f.setError(e instanceof Error?e.message:'No se pudo registrar el descarte');}
 }}>
 {f.error&&<ToastNotification variant="error" title="Error" message={f.error}/>}
 <p className="text-sm text-gray-500 dark:text-gray-400">Libres (sin pedido): <strong>{f.libres}</strong> {stockItem.simbolo_unidad}.
  {reservados>0&&<> Reservados para pedidos: {reservados}; esos se cancelan desde el pedido.</>}</p>
 <Label>Motivo *</Label><ListaSelect idLista={LISTA_IDS.ALM_MOTIVO_MOVIMIENTO} campoValor="id" tipoMovimiento={f.tipo?.valor_entero??undefined}
 codigos={MOTIVOS_DESCARTE} defaultValue={f.motivo} onChange={f.setMotivo} disabled={!f.tipo||isSaving} placeholder="Seleccione motivo"/>
 <Label>Cantidad a descartar ({stockItem.simbolo_unidad})</Label><Input type="number" min="0.0001" max={String(f.libres)} step={0.0001} value={f.cantidad} disabled={isSaving} onChange={e=>f.setCantidad(Number(e.target.value))}/>
 <Label>Observación</Label><Input value={f.observacion} disabled={isSaving} onChange={e=>f.setObservacion(e.target.value)}/>
 <p className="text-xs text-gray-500 dark:text-gray-400">Se registra una salida de inventario al costo promedio; los ingredientes ya consumidos no vuelven al almacén. Para mantenerlos disponibles, elige Conservar.</p>
 {f.razon&&<p className="text-sm text-warning-700 dark:text-warning-400">{f.razon}</p>}
 </FormModal>;
}
