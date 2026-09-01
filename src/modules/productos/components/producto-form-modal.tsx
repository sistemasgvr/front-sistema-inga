"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { ProductoItem, ProductoFormValues, UnidadMedidaItem } from "../types/productos.types";

type SubcategoriaItem = { id: number; nombre: string };
type AlmacenItem = { id: number; nombre: string };
type EstacionItem = { id: number; nombre: string };

type ProductoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductoFormValues) => Promise<void>;
  producto: ProductoItem | null;
  unidades: UnidadMedidaItem[];
  subcategorias: SubcategoriaItem[];
  almacenes: AlmacenItem[];
  estaciones: EstacionItem[];
  isSaving: boolean;
};

export function ProductoFormModal({
  isOpen,
  onClose,
  onSubmit,
  producto,
  unidades,
  subcategorias,
  almacenes,
  estaciones,
  isSaving,
}: ProductoFormModalProps) {
  const [values, setValues] = useState<ProductoFormValues>({
    id_subcategoria: subcategorias[0]?.id ?? 1,
    id_unidad_medida: unidades[0]?.id ?? 1,
    id_estacion: null,
    id_almacen_stock: null,
    codigo_interno: "",
    nombre: "",
    descripcion: "",
    tipo_producto: 3, // Plato Carta por defecto
    precio_venta: 0,
    afecto_igv: true,
    controla_stock: false,
    disponible_venta: true,
    tiempo_prep_min: 15,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (producto) {
      setValues({
        id_subcategoria: producto.id_subcategoria,
        id_unidad_medida: producto.id_unidad_medida,
        id_estacion: producto.id_estacion ?? null,
        id_almacen_stock: producto.id_almacen_stock ?? null,
        codigo_interno: producto.codigo_interno || "",
        nombre: producto.nombre || "",
        descripcion: producto.descripcion || "",
        tipo_producto: producto.tipo_producto || 3,
        precio_venta: Number(producto.precio_venta) || 0,
        afecto_igv: Boolean(producto.afecto_igv),
        controla_stock: Boolean(producto.controla_stock),
        disponible_venta: Boolean(producto.disponible_venta),
        tiempo_prep_min: producto.tiempo_prep_min ?? 15,
      });
    } else {
      setValues({
        id_subcategoria: subcategorias[0]?.id ?? 1,
        id_unidad_medida: unidades[0]?.id ?? 1,
        id_estacion: null,
        id_almacen_stock: null,
        codigo_interno: "",
        nombre: "",
        descripcion: "",
        tipo_producto: 3,
        precio_venta: 0,
        afecto_igv: true,
        controla_stock: false,
        disponible_venta: true,
        tiempo_prep_min: 15,
      });
    }
  }, [isOpen, producto, unidades, subcategorias]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.nombre.trim() || !values.codigo_interno.trim()) return;
    await onSubmit(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {producto ? "Editar Producto" : "Nuevo Producto"}
        </h4>
        <p className="text-xs text-gray-500 mb-6">Configura los datos del producto o plato en el sistema.</p>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="codigo_interno">Código Interno *</Label>
              <Input
                id="codigo_interno"
                value={values.codigo_interno}
                onChange={(e) => setValues((p) => ({ ...p, codigo_interno: e.target.value }))}
                placeholder="Ej. PROD-0001"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="nombre">Nombre del Producto *</Label>
              <Input
                id="nombre"
                value={values.nombre}
                onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej. Lomo Saltado"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tipo_producto">Tipo de Producto</Label>
              <select
                id="tipo_producto"
                value={values.tipo_producto}
                onChange={(e) => setValues((p) => ({ ...p, tipo_producto: Number(e.target.value) }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value={1}>1 - Insumo Crudo</option>
                <option value={2}>2 - Insumo Procesado</option>
                <option value={3}>3 - Plato Carta</option>
                <option value={4}>4 - Plato Menú</option>
                <option value={5}>5 - Trago</option>
                <option value={6}>6 - Bebida Unitaria</option>
                <option value={7}>7 - Adicional</option>
              </select>
            </div>
            <div>
              <Label htmlFor="id_subcategoria">Subcategoría *</Label>
              <select
                id="id_subcategoria"
                value={values.id_subcategoria}
                onChange={(e) => setValues((p) => ({ ...p, id_subcategoria: Number(e.target.value) }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {subcategorias.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="id_unidad_medida">Unidad de Medida *</Label>
              <select
                id="id_unidad_medida"
                value={values.id_unidad_medida}
                onChange={(e) => setValues((p) => ({ ...p, id_unidad_medida: Number(e.target.value) }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} ({u.simbolo})</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="precio_venta">Precio de Venta (S/)</Label>
              <Input
                id="precio_venta"
                type="number"
                step={0.01}
                value={values.precio_venta}
                onChange={(e) => setValues((p) => ({ ...p, precio_venta: Number(e.target.value) }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="id_estacion">Estación de Impresión / KDS</Label>
              <select
                id="id_estacion"
                value={values.id_estacion ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, id_estacion: e.target.value ? Number(e.target.value) : null }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">-- Sin estación asignada --</option>
                {estaciones.map((est) => (
                  <option key={est.id} value={est.id}>{est.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="id_almacen_stock">Almacén de Stock</Label>
              <select
                id="id_almacen_stock"
                value={values.id_almacen_stock ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, id_almacen_stock: e.target.value ? Number(e.target.value) : null }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">-- Sin almacén asignado --</option>
                {almacenes.map((alm) => (
                  <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="tiempo_prep_min">Tiempo Prep. (min)</Label>
            <Input
              id="tiempo_prep_min"
              type="number"
              value={values.tiempo_prep_min ?? 15}
              onChange={(e) => setValues((p) => ({ ...p, tiempo_prep_min: Number(e.target.value) }))}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button size="sm" type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
        </div>
      </form>
    </Modal>
  );
}