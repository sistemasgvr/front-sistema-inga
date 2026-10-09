"use client";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import { ListaSelect, LISTA_IDS } from "@/modules/listas";
import { useAjusteStock } from "../hooks/use-ajuste-stock";
import type { StockItem, RegistrarMovimientoValues } from "../types/inventario.types";
type Props={isOpen:boolean;onClose:()=>void;onSubmit:(v:RegistrarMovimientoValues)=>Promise<void>;stockItem:StockItem|null;isSaving:boolean};
export function AjusteStockModal({isOpen,onClose,onSubmit,stockItem,isSaving}:Props){
 const f=useAjusteStock(isOpen);
 if(!isOpen||!stockItem)return null;
 return <FormModal isOpen={isOpen} onClose={onClose} title="Ajuste de inventario" subtitle={stockItem.producto_nombre}
 isSaving={isSaving} submitDisabled={!f.tipo||!f.motivo||f.cargando} onSubmit={async e=>{
 e.preventDefault();if(isSaving||!f.tipo||!f.motivo)return;
 if(!Number.isFinite(f.cantidad)||f.cantidad<=0){f.setError('La cantidad debe ser mayor a cero.');return;}
 try{await onSubmit({codigo:'AJ-'+crypto.randomUUID(),id_tipo_movimiento:f.tipo.id,id_motivo_movimiento:Number(f.motivo),
 id_almacen:stockItem.id_almacen,id_producto:stockItem.id_producto,id_unidad_medida:stockItem.id_unidad_medida,
 cantidad:f.cantidad,signo:f.signo,costo_unitario:Number(stockItem.costo_promedio),observacion:f.observacion,confirmar:true});}
 catch(e){f.setError(e instanceof Error?e.message:'No se pudo registrar el ajuste');}
 }}>
 {f.error&&<Alert variant="error" title="Error" message={f.error}/>}
 <Label>Motivo *</Label><ListaSelect idLista={LISTA_IDS.ALM_MOTIVO_MOVIMIENTO} campoValor="id" tipoMovimiento={f.tipo?.valor_entero??undefined}
 defaultValue={f.motivo} onChange={f.setMotivo} disabled={!f.tipo||isSaving} placeholder="Seleccione motivo"/>
 <Label>Efecto sobre el stock</Label><Select options={[{value:'1',label:'Aumentar (+)'},{value:'-1',label:'Disminuir (-)'}]}
 defaultValue={String(f.signo)} onChange={v=>f.setSigno(Number(v) as 1|-1)} disabled={isSaving}/>
 <Label>Cantidad ({stockItem.simbolo_unidad})</Label><Input type="number" min="0.0001" step={0.0001} value={f.cantidad} onChange={e=>f.setCantidad(Number(e.target.value))}/>
 <Label>Observación</Label><Input value={f.observacion} onChange={e=>f.setObservacion(e.target.value)}/>
 </FormModal>;
}
