const fs=require('node:fs');const edit=(f,fn)=>fs.writeFileSync(f,fn(fs.readFileSync(f,'utf8')));
const file='src/modules/inventario/components/ajuste-stock-modal.tsx';
fs.writeFileSync(file,`"use client";
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
`);
edit('src/modules/inventario/services/inventario.service.ts',s=>{
const a=s.indexOf('export async function listStock'),b=s.indexOf('export async function registrarAjusteStock',a);
return s.slice(0,a)+`export async function listStock(params: ListStockParams, signal?: AbortSignal) {
 return apiGet<{registros: StockItem[]; total:number; resumen: {total:number;alertas:number;normales:number}}>("/inventario/stock",{
  signal,params:{id_almacen:params.id_almacen,limite:params.limite,offset:(params.pagina-1)*params.limite,buscar:params.buscar,estado:params.estado}
 });
}
\n`+s.slice(b).replace('values.costo_unitario || undefined','values.costo_unitario ?? undefined');});
edit('src/modules/inventario/hooks/use-stock.ts',s=>{
s=s.replace('useCallback, useEffect, useState','useCallback, useEffect, useRef, useState');
s='import { useLazyOptions } from "@/shared/hooks/use-lazy-options";\n'+s;
s=s.replace('"use client";\n','');s='"use client";\n'+s;
s=s.replace('  const [availableAlmacenes, setAvailableAlmacenes] = useState<AlmacenItem[]>([]);',`  const almacenes=useLazyOptions(useCallback(async()=> (await listAlmacenes({pagina:1,limite:100,estado:'activos'})).registros??[],[]));
  const request=useRef<AbortController|null>(null);
  const [revision,setRevision]=useState(0);`);
const a=s.indexOf('  useEffect(() => {\n    async function loadFormCatalogs()'),b=s.indexOf('  const loadStockData',a);
if(a>=0)s=s.slice(0,a)+s.slice(b);
s=s.replace('    setIsLoading(true);\n    try {','    request.current?.abort();\n    const controller=new AbortController();request.current=controller;\n    setIsLoading(true);\n    try {');
s=s.replace('        id_almacen: selectedAlmacenId,\n      });','        id_almacen: selectedAlmacenId,\n      },controller.signal);\n      if(controller.signal.aborted)return;');
s=s.replace('      toast("error", "Error de carga",','      if(controller.signal.aborted)return;\n      toast("error", "Error de carga",');
s=s.replace('      setIsLoading(false);','      if(!controller.signal.aborted)setIsLoading(false);');
s=s.replace('estadoFiltro, selectedAlmacenId, toast]);','estadoFiltro, selectedAlmacenId, toast, revision]);');
s=s.replace('    void loadStockData();\n  }, [loadStockData]);','    void loadStockData();\n    return ()=>request.current?.abort();\n  }, [loadStockData]);');
s=s.replace('      closeAjusteModal();\n      await loadStockData();','      setIsAjusteModalOpen(false);setAdjustingStockItem(null);\n      await loadStockData();');
s=s.replace('handleFilterStatus: (status: StockStatusFilter) => { setEstadoFiltro(status); setPagina(1); },','handleFilterStatus: (status: StockStatusFilter) => { setEstadoFiltro(status); setPagina(1); setRevision(r=>r+1); },');
s=s.replace('    setSelectedAlmacenId,','    setSelectedAlmacenId: (id: number|undefined)=>{setSelectedAlmacenId(id);setPagina(1);setRevision(r=>r+1);},');
s=s.replace('    availableAlmacenes,','    availableAlmacenes: almacenes.options,\n    loadAlmacenes: almacenes.load,\n    loadingAlmacenes: almacenes.isLoading,\n    errorAlmacenes: almacenes.error,');return s;});
edit('src/modules/inventario/components/inventario-view.tsx',s=>s.replace('    availableAlmacenes,','    availableAlmacenes, loadAlmacenes, loadingAlmacenes, errorAlmacenes,')
.replace('options={almacenesOptions}','options={almacenesOptions} onOpen={()=>void loadAlmacenes()} isLoading={loadingAlmacenes} loadError={errorAlmacenes}'));
