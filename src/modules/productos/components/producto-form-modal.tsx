"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import { FormModal } from "@/components/ui/modal/FormModal";
import { Icon } from "@/components/ui/icon";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { useToast } from "@/components/ui/toast/ToastContext";
import { uploadProductoImagenApi } from "../services/productos.service";
import { FormEvent, useEffect, useState, ChangeEvent } from "react";
import type {
  ProductoItem,
  ProductoFormValues,
  UnidadMedidaItem,
  CategoriaItem,
  SubcategoriaItem,
} from "../types/productos.types";

type AlmacenItem = { id: number; nombre: string };
type EstacionItem = { id: number; nombre: string };

type ProductoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductoFormValues) => Promise<void>;
  producto: ProductoItem | null;
  unidades: UnidadMedidaItem[];
  categorias?: CategoriaItem[];
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
  unidades = [],
  categorias = [],
  subcategorias = [],
  almacenes = [],
  estaciones = [],
  isSaving,
}: ProductoFormModalProps) {
  const { toast } = useToast();
  const { opciones: tiposProductoBD, isLoading: isLoadingTipos } = useCatalogo("PRODUCTO_TIPO");

  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [values, setValues] = useState<ProductoFormValues>({
    id_subcategoria: 0,
    id_unidad_medida: 0,
    id_estacion: null,
    id_almacen_stock: null,
    codigo_interno: "",
    nombre: "",
    descripcion: "",
    tipo_producto: 0,
    precio_venta: 0,
    afecto_igv: true,
    controla_stock: false,
    disponible_venta: true,
    tiempo_prep_min: 15,
    imagen_url: "",
  });

  const [costoReceta, setCostoReceta] = useState<number>(0);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductoFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ProductoFormValues, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const esInsumo = [1, 2].includes(values.tipo_producto);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedFile(null);

    if (producto) {
      const sub = subcategorias.find((s) => s.id === producto.id_subcategoria);
      const catId = producto.id_categoria ?? sub?.id_categoria ?? null;
      setSelectedCategoriaId(catId);

      setValues({
        id_subcategoria: producto.id_subcategoria,
        id_unidad_medida: producto.id_unidad_medida,
        id_estacion: producto.id_estacion ?? null,
        id_almacen_stock: producto.id_almacen_stock ?? null,
        codigo_interno: producto.codigo_interno || "",
        nombre: producto.nombre || "",
        descripcion: producto.descripcion || "",
        tipo_producto: producto.tipo_producto,
        precio_venta: Number(producto.precio_venta) || 0,
        afecto_igv: Boolean(producto.afecto_igv),
        controla_stock: Boolean(producto.controla_stock),
        disponible_venta: Boolean(producto.disponible_venta),
        tiempo_prep_min: producto.tiempo_prep_min ?? 15,
        imagen_url: producto.imagen_url || "",
      });
      setCostoReceta(Number(producto.costo_receta_calculado) || 0);
      setImagePreview(producto.imagen_url || null);
    } else {
      const firstCatId = categorias[0]?.id ?? null;
      setSelectedCategoriaId(firstCatId);

      const subFilt = firstCatId
        ? subcategorias.filter((s) => s.id_categoria === firstCatId)
        : subcategorias;

      setValues({
        id_subcategoria: subFilt[0]?.id ?? subcategorias[0]?.id ?? 0,
        id_unidad_medida: unidades[0]?.id ?? 0,
        id_estacion: null,
        id_almacen_stock: almacenes[0]?.id ?? null,
        codigo_interno: "",
        nombre: "",
        descripcion: "",
        tipo_producto: tiposProductoBD[0]?.valor_entero ?? 3,
        precio_venta: 0,
        afecto_igv: true,
        controla_stock: false,
        disponible_venta: true,
        tiempo_prep_min: 15,
        imagen_url: "",
      });
      setCostoReceta(0);
      setImagePreview(null);
    }

    setErrors({});
    setTouched({});
    setIsSubmitted(false);
  }, [isOpen, producto]);

  const filteredSubcategorias = selectedCategoriaId
    ? subcategorias.filter((s) => s.id_categoria === selectedCategoriaId)
    : subcategorias;

  function handleTipoProductoChange(val: string) {
    const numTipo = Number(val);
    const isIns = [1, 2].includes(numTipo);

    setValues((p) => ({
      ...p,
      tipo_producto: numTipo,
      controla_stock: isIns,
      disponible_venta: !isIns,
      precio_venta: isIns ? 0 : p.precio_venta,
      id_estacion: isIns ? null : p.id_estacion,
      id_almacen_stock: isIns ? p.id_almacen_stock || (almacenes[0]?.id ?? null) : p.id_almacen_stock,
    }));
    handleBlur("tipo_producto");
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimeTypes.includes(file.type)) {
      toast("error", "Formato no permitido", "Solo se admiten imágenes JPG, PNG o WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("error", "Archivo pesado", "La imagen no puede pesar más de 5 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setSelectedFile(null);
    setImagePreview(null);
    setValues((prev) => ({ ...prev, imagen_url: "" }));
  }

  function handleBlur(field: keyof ProductoFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(currentValues: ProductoFormValues = values): boolean {
    const next: Partial<Record<keyof ProductoFormValues, string>> = {};

    if (!currentValues.codigo_interno.trim()) next.codigo_interno = "El código interno es obligatorio.";
    if (!currentValues.nombre.trim()) next.nombre = "El nombre del producto es obligatorio.";
    if (!currentValues.id_subcategoria) next.id_subcategoria = "La subcategoría es obligatoria.";
    if (!currentValues.id_unidad_medida) next.id_unidad_medida = "La unidad de medida es obligatoria.";
    if (!currentValues.tipo_producto) next.tipo_producto = "El tipo de producto es obligatorio.";

    if (esInsumo && !currentValues.id_almacen_stock) {
      next.id_almacen_stock = "Los insumos deben tener un almacén asignado.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function showError(field: keyof ProductoFormValues): string | undefined {
    return isSubmitted || touched[field] ? errors[field] : undefined;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving || uploadingImage) return;
    setIsSubmitted(true);

    if (!validate()) return;

    try {
      let finalImageUrl = values.imagen_url;

      if (selectedFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadProductoImagenApi(selectedFile);
      }

      await onSubmit({
        ...values,
        imagen_url: finalImageUrl,
      });
    } catch (error) {
      toast(
        "error",
        "Error al procesar",
        error instanceof Error ? error.message : "Ocurrió un error inesperado al guardar el producto."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  const categoriaOptions = categorias.map((cat) => ({
    value: String(cat.id),
    label: cat.nombre,
  }));

  const subcategoriaOptions = filteredSubcategorias.map((sub) => ({
    value: String(sub.id),
    label: sub.nombre,
  }));

  const tipoProductoOptions = tiposProductoBD.map((tipo) => ({
    value: String(tipo.valor_entero),
    label: tipo.nombre,
  }));

  const unidadOptions = unidades.map((u) => ({
    value: String(u.id),
    label: `${u.nombre} (${u.simbolo})`,
  }));

  const estacionOptions = [
    { value: "", label: "-- Sin estación asignada --" },
    ...estaciones.map((est) => ({
      value: String(est.id),
      label: est.nombre,
    })),
  ];

  const almacenOptions = [
    { value: "", label: "-- Sin almacén asignado --" },
    ...almacenes.map((alm) => ({
      value: String(alm.id),
      label: alm.nombre,
    })),
  ];

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={producto ? "Editar registro" : esInsumo ? "Nuevo Insumo" : "Nuevo Producto / Plato"}
      subtitle={
        producto
          ? "Actualiza las especificaciones del ítem en el catálogo."
          : "Completa la información requerida para el registro."
      }
      isSaving={isSaving || uploadingImage}
      maxWidth="max-w-[720px]"
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5 dark:border-gray-800">
            <Icon name="mdi:tag-outline" size={18} className="text-brand-600 dark:text-brand-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              1. Identificación y Tipo
            </h4>
          </div>

          <div>
            <Label>Tipo de Registro *</Label>
            <Select
              options={tipoProductoOptions}
              defaultValue={values.tipo_producto ? String(values.tipo_producto) : ""}
              placeholder={isLoadingTipos ? "Cargando tipos..." : "Seleccione tipo..."}
              disabled={isSaving || isLoadingTipos}
              error={Boolean(showError("tipo_producto"))}
              hint={showError("tipo_producto")}
              onChange={handleTipoProductoChange}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 w-full space-y-4">
              <div>
                <Label htmlFor="codigo_interno">Código Interno *</Label>
                <Input
                  id="codigo_interno"
                  value={values.codigo_interno}
                  onChange={(e) => {
                    setValues((p) => ({ ...p, codigo_interno: e.target.value.toUpperCase() }));
                  }}
                  onBlur={() => handleBlur("codigo_interno")}
                  placeholder={esInsumo ? "Ej. INS-0001" : "Ej. PROD-0001"}
                  error={Boolean(showError("codigo_interno"))}
                  hint={showError("codigo_interno")}
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="nombre">{esInsumo ? "Nombre del Insumo *" : "Nombre del Producto *"}</Label>
                <Input
                  id="nombre"
                  value={values.nombre}
                  onChange={(e) => {
                    setValues((p) => ({ ...p, nombre: e.target.value }));
                  }}
                  onBlur={() => handleBlur("nombre")}
                  placeholder={esInsumo ? "Ej. Carne Trozada para Lomo" : "Ej. Lomo Saltado"}
                  error={Boolean(showError("nombre"))}
                  hint={showError("nombre")}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="w-full sm:w-32 shrink-0">
              <Label>Imagen</Label>
              <div className="mt-1.5 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-2 text-center dark:border-gray-700 dark:bg-gray-900">
                {imagePreview ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isSaving || uploadingImage}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors cursor-pointer"
                      title="Quitar"
                    >
                      <Icon name="mdi:close" size={12} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="imagen_file" className="cursor-pointer flex flex-col items-center py-2">
                    <Icon name="mdi:image-plus" size={26} className="text-gray-400" />
                    <span className="mt-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                      {uploadingImage ? "Subiendo..." : "Subir Foto"}
                    </span>
                  </label>
                )}
                <input
                  type="file"
                  id="imagen_file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isSaving || uploadingImage}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5 dark:border-gray-800">
            <Icon name="mdi:shape-outline" size={18} className="text-brand-600 dark:text-brand-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              2. Clasificación y Unidades
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Categoría *</Label>
              <Select
                options={categoriaOptions}
                defaultValue={selectedCategoriaId ? String(selectedCategoriaId) : ""}
                placeholder={categorias.length === 0 ? "Cargando..." : "-- Seleccione Categoría --"}
                disabled={isSaving || categorias.length === 0}
                onChange={(val) => {
                  const catId = val ? Number(val) : null;
                  const subFilt = catId
                    ? subcategorias.filter((s) => s.id_categoria === catId)
                    : [];

                  setSelectedCategoriaId(catId);
                  setValues((p) => ({ ...p, id_subcategoria: subFilt[0]?.id ?? 0 }));
                }}
              />
            </div>

            <div>
              <Label>Subcategoría *</Label>
              <Select
                options={subcategoriaOptions}
                defaultValue={values.id_subcategoria ? String(values.id_subcategoria) : ""}
                placeholder={
                  !selectedCategoriaId
                    ? "Primero seleccione categoría"
                    : subcategoriaOptions.length === 0
                    ? "Sin subcategorías"
                    : "-- Seleccione Subcategoría --"
                }
                disabled={isSaving || !selectedCategoriaId || subcategoriaOptions.length === 0}
                error={Boolean(showError("id_subcategoria"))}
                hint={showError("id_subcategoria")}
                onChange={(val) => {
                  setValues((p) => ({ ...p, id_subcategoria: Number(val) }));
                  handleBlur("id_subcategoria");
                }}
              />
            </div>
          </div>

          <div>
            <Label>Unidad de Medida Base * (Con Buscador Inteligente)</Label>
            <Select
              options={unidadOptions}
              defaultValue={values.id_unidad_medida ? String(values.id_unidad_medida) : ""}
              placeholder={unidades.length === 0 ? "Cargando..." : "Seleccione unidad..."}
              searchPlaceholder="Escriba para buscar unidad (ej. kg, oz, ml)..."
              disabled={isSaving || unidades.length === 0}
              error={Boolean(showError("id_unidad_medida"))}
              hint={showError("id_unidad_medida")}
              onChange={(val) => {
                setValues((p) => ({ ...p, id_unidad_medida: Number(val) }));
                handleBlur("id_unidad_medida");
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5 dark:border-gray-800">
            <Icon name="mdi:cog-outline" size={18} className="text-brand-600 dark:text-brand-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              3. Parámetros Operativos
            </h4>
          </div>

          {esInsumo ? (
            <div>
              <Label>Almacén de Stock *</Label>
              <Select
                options={almacenOptions}
                defaultValue={values.id_almacen_stock ? String(values.id_almacen_stock) : ""}
                placeholder="Seleccione almacén asignado..."
                disabled={isSaving}
                error={Boolean(showError("id_almacen_stock"))}
                hint={showError("id_almacen_stock")}
                onChange={(val) => {
                  setValues((p) => ({ ...p, id_almacen_stock: val ? Number(val) : null }));
                }}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="precio_venta">Precio de Venta (S/)</Label>
                  <Input
                    id="precio_venta"
                    type="number"
                    step={0.01}
                    value={values.precio_venta}
                    onChange={(e) => setValues((p) => ({ ...p, precio_venta: Number(e.target.value) }))}
                    placeholder="0.00"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label htmlFor="costo_receta">Costo de Receta (S/)</Label>
                  <Input
                    id="costo_receta"
                    type="number"
                    value={costoReceta.toFixed(2)}
                    disabled
                    hint="Calculado automáticamente al armar la receta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Estación de Impresión / KDS</Label>
                  <Select
                    options={estacionOptions}
                    defaultValue={values.id_estacion ? String(values.id_estacion) : ""}
                    placeholder="Sin estación asignada"
                    disabled={isSaving}
                    onChange={(val) => {
                      setValues((p) => ({ ...p, id_estacion: val ? Number(val) : null }));
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="tiempo_prep_min">Tiempo Prep. Estimado (Min.)</Label>
                  <Input
                    id="tiempo_prep_min"
                    type="number"
                    value={values.tiempo_prep_min ?? 15}
                    onChange={(e) => setValues((p) => ({ ...p, tiempo_prep_min: Number(e.target.value) }))}
                    placeholder="Ej. 15"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
            <Checkbox
              id="controla_stock"
              label="Controla Stock"
              checked={values.controla_stock}
              onChange={(checked) => setValues((p) => ({ ...p, controla_stock: checked }))}
              disabled={isSaving}
            />

            {!esInsumo && (
              <Checkbox
                id="disponible_venta"
                label="Disponible en Carta"
                checked={values.disponible_venta}
                onChange={(checked) => setValues((p) => ({ ...p, disponible_venta: checked }))}
                disabled={isSaving}
              />
            )}

            <Checkbox
              id="afecto_igv"
              label="Afecto a IGV"
              checked={values.afecto_igv}
              onChange={(checked) => setValues((p) => ({ ...p, afecto_igv: checked }))}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>
    </FormModal>
  );
}