"use client";
import { FormModal } from "@/components/ui/modal/FormModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import { usePreparacion } from "../hooks/use-preparacion";
import type { CocinaItem } from "../types/cocina.types";

export function PreparacionModal({sucursal,item,onClose,onSaved}:{sucursal:number;item:CocinaItem|null;onClose:()=>void;onSaved:()=>void}) {
  const p=usePreparacion(sucursal,item,onSaved);
  return <FormModal isOpen onClose={()=>{if(!p.saving)onClose();}} title={item?`Preparar: ${item.nombre_producto}`:"Preparación anticipada"}
    subtitle="Confirma cuando las porciones estén preparadas. Se descontarán los ingredientes y se ingresarán los platos al almacén."
    isSaving={p.saving} submitDisabled={!p.puedeGuardar} submitText="Confirmar preparación terminada" onSubmit={e=>{e.preventDefault();void p.guardar();}}>
    {p.error&&<Alert variant="error" title="Preparación" message={p.error}/>}
    {!item&&<div><Label>Producto con receta</Label><Select options={p.productos.options.map(x=>({value:String(x.id),label:`${x.nombre} · ${x.almacen}`}))}
      defaultValue={p.producto} onChange={p.cambiarProducto} onOpen={()=>void p.productos.load()} isLoading={p.productos.isLoading} loadError={p.productos.error} disabled={p.saving}/></div>}
    <div><Label>Porciones que se terminaron de preparar</Label><Input type="number" min="0.0001" step={0.0001} value={p.cantidad} disabled={p.saving}
      onChange={e=>p.setCantidad(Number(e.target.value))}/></div>
    {p.loading&&<p role="status">Consultando ingredientes…</p>}
    {p.disponibilidad&&<>
      <p className="text-sm text-gray-500">Preparados: {p.disponibilidad.preparados} · Reservados: {p.disponibilidad.reservados} · Se pueden preparar: {p.disponibilidad.posibles_preparar}</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Ingrediente</th><th>Necesario</th><th>Disponible</th><th>Falta</th></tr></thead>
        <tbody>{p.disponibilidad.ingredientes.map(x=><tr key={x.id_producto} className="border-t border-gray-200 dark:border-gray-800">
          <td className="py-2">{x.nombre}</td><td>{x.requerido} {x.simbolo}</td><td>{x.disponible}</td><td>{x.faltante}</td></tr>)}</tbody></table></div>
    </>}
  </FormModal>;
}
