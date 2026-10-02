"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import TextArea from "@/components/form/input/TextArea";
import { FormModal } from "@/components/ui/modal/FormModal";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { useToast } from "@/components/ui/toast/ToastContext";
import { uploadProductoImagenApi } from "../services/productos.service";
import { FormEvent, useEffect, useState, ChangeEvent, useRef } from "react";
import type {
  ProductoItem,
  ProductoFormValues,
  UnidadMedidaItem,
  CategoriaItem,
  SubcategoriaItem,
} from "../types/productos.types";

type AlmacenItem = { id: number; nombre: string; tipo_almacen?: number };
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showConfirmRemoveImage, setShowConfirmRemoveImage] = useState(false);

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

  const tipo = Number(values.tipo_producto);
  const esCrudo = tipo === 1;
  const esProcesado = tipo === 2;
  const esPlatoCarta = tipo === 3;
  const esPlatoMenu = tipo === 4;
  const esTrago = tipo === 5;
  const esBebidaUnitaria = tipo === 6;
  const esAdicional = tipo === 7;

  const esPlatoOTrago = [3, 4, 5].includes(tipo);
  const esInsumo = esCrudo || esProcesado;
  const requiereEstacion = [3, 4, 5, 6].includes(tipo);
  const requiereAlmacen = esInsumo || esBebidaUnitaria || values.controla_stock;

  useEffect(() => {
    if (!isOpen) return;

    setSelectedFile(null);
    setShowConfirmRemoveImage(false);

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

      const defaultTipo = tiposProductoBD[0]?.valor_entero ?? 3;

      setValues({
        id_subcategoria: subFilt[0]?.id ?? subcategorias[0]?.id ?? 0,
        id_unidad_medida: unidades[0]?.id ?? 0,
        id_estacion: estaciones[0]?.id ?? null,
        id_almacen_stock: almacenes[0]?.id ?? null,
        codigo_interno: "",
        nombre: "",
        descripcion: "",
        tipo_producto: defaultTipo,
        precio_venta: 0,
        afecto_igv: true,
        controla_stock: [1, 2, 6].includes(defaultTipo),
        disponible_venta: [3, 4, 5, 6, 7].includes(defaultTipo),
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
    const isVend = [3, 4, 5, 6, 7].includes(numTipo);

    setValues((p) => ({
      ...p,
      tipo_producto: numTipo,
      controla_stock: isIns || numTipo === 6,
      disponible_venta: isIns ? false : isVend,
      precio_venta: isIns ? 0 : p.precio_venta,
      id_estacion: [3, 4, 5, 6].includes(numTipo) ? p.id_estacion || (estaciones[0]?.id ?? null) : null,
      id_almacen_stock: isIns || numTipo === 6 ? p.id_almacen_stock || (almacenes[0]?.id ?? null) : null,
    }));
    handleBlur("tipo_producto");
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("error", "Formato no permitido", "Solo se admiten imágenes JPG, PNG o WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("error", "Archivo pesado", "La imagen no puede superar los 5 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function confirmRemoveImage() {
    setSelectedFile(null);
    setImagePreview(null);
    setValues((prev) => ({ ...prev, imagen_url: "" }));
    setShowConfirmRemoveImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleBlur(field: keyof ProductoFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(currentValues: ProductoFormValues = values): boolean {
    const next: Partial<Record<keyof ProductoFormValues, string>> = {};
    const t = Number(currentValues.tipo_producto);

    if (!currentValues.codigo_interno.trim()) next.codigo_interno = "El código es obligatorio.";
    if (!currentValues.nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!currentValues.id_subcategoria) next.id_subcategoria = "La subcategoría es obligatoria.";
    if (!currentValues.id_unidad_medida) next.id_unidad_medida = "La unidad es obligatoria.";
    if (!currentValues.tipo_producto) next.tipo_producto = "El tipo de producto es obligatorio.";

    if ([3, 4, 5, 6].includes(t) && !currentValues.id_estacion) {
      next.id_estacion = "Debes asignar una estación de impresión para este tipo.";
    }

    if ((currentValues.controla_stock || [1, 2, 6].includes(t)) && !currentValues.id_almacen_stock) {
      next.id_almacen_stock = "Debes asignar un almacén de stock.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function showError(field: keyof ProductoFormValues): string | undefined {
    return isSubmitted || touched[field] ? errors[field] : undefined;
  }

  function sanearPayloadPorTipo(raw: ProductoFormValues): ProductoFormValues {
    const t = Number(raw.tipo_producto);

    switch (t) {
      case 1:
        return {
          ...raw,
          tipo_producto: 1,
          precio_venta: 0,
          controla_stock: true,
          disponible_venta: false,
          id_estacion: null,
          tiempo_prep_min: undefined,
        };

      case 2:
        return {
          ...raw,
          tipo_producto: 2,
          precio_venta: 0,
          controla_stock: true,
          disponible_venta: false,
          id_estacion: null,
          tiempo_prep_min: undefined,
        };

      case 3:
      case 4:
      case 5:
        return {
          ...raw,
          tipo_producto: t,
          precio_venta: Math.max(0, Number(raw.precio_venta) || 0),
          controla_stock: false,
          disponible_venta: Boolean(raw.disponible_venta),
          id_almacen_stock: null,
          id_estacion: raw.id_estacion ? Number(raw.id_estacion) : null,
          tiempo_prep_min: raw.tiempo_prep_min ? Number(raw.tiempo_prep_min) : 15,
        };

      case 6:
        return {
          ...raw,
          tipo_producto: 6,
          precio_venta: Math.max(0, Number(raw.precio_venta) || 0),
          controla_stock: true,
          disponible_venta: Boolean(raw.disponible_venta),
          id_almacen_stock: raw.id_almacen_stock ? Number(raw.id_almacen_stock) : null,
          id_estacion: raw.id_estacion ? Number(raw.id_estacion) : null,
          tiempo_prep_min: undefined,
        };

      case 7:
      default:
        return {
          ...raw,
          tipo_producto: t || 7,
          precio_venta: Math.max(0, Number(raw.precio_venta) || 0),
          controla_stock: false,
          disponible_venta: Boolean(raw.disponible_venta),
          id_almacen_stock: null,
          id_estacion: null,
          tiempo_prep_min: undefined,
        };
    }
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

      const payloadSaneado = sanearPayloadPorTipo({
        ...values,
        imagen_url: finalImageUrl,
      });

      await onSubmit(payloadSaneado);
    } catch (error) {
      toast(
        "error",
        "Error al guardar",
        error instanceof Error ? error.message : "Ocurrió un error al procesar el registro."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  // Placeholders dinámicos por Tipo de Producto
  const getNombrePlaceholder = () => {
    if (esCrudo) return "Ej. Pato Entero / Saco de Arroz 50kg";
    if (esProcesado) return "Ej. Presa de Pato Limpia / Pote Salsa Culantro";
    if (esPlatoCarta) return "Ej. Arroz con Pato Arequipeño / Lomo Saltado";
    if (esPlatoMenu) return "Ej. Seco de Pollo con Frijoles / Menú Ejecutivo";
    if (esTrago) return "Ej. Pisco Sour Catedral / Chilcano de Kion";
    if (esBebidaUnitaria) return "Ej. Cerveza Cusqueña Dorada 330ml / Agua San Luis";
    if (esAdicional) return "Ej. Crema Huancaína Extra / Porción de Arroz";
    return "Ej. Nombre del producto";
  };

  const getCodigoPlaceholder = () => {
    if (esCrudo) return "Ej. CRU-001";
    if (esProcesado) return "Ej. PROC-001";
    if (esPlatoCarta) return "Ej. PLT-001";
    if (esPlatoMenu) return "Ej. MNU-001";
    if (esTrago) return "Ej. TRG-001";
    if (esBebidaUnitaria) return "Ej. BEB-001";
    if (esAdicional) return "Ej. ADC-001";
    return "Ej. PROD-001";
  };

  const categoriaOptions = categorias.map((cat) => ({ value: String(cat.id), label: cat.nombre }));
  const subcategoriaOptions = filteredSubcategorias.map((sub) => ({ value: String(sub.id), label: sub.nombre }));
  const tipoProductoOptions = tiposProductoBD.map((t) => ({ value: String(t.valor_entero), label: t.nombre }));
  const unidadOptions = unidades.map((u) => ({ value: String(u.id), label: `${u.nombre} (${u.simbolo})` }));

  const estacionOptions = [
    { value: "", label: "-- Seleccione Estación --" },
    ...estaciones.map((est) => ({ value: String(est.id), label: est.nombre })),
  ];

  const almacenesFiltrados = almacenes.filter((a) => {
    if (esCrudo) return a.tipo_almacen === 1;
    if (esProcesado) return [2, 3].includes(a.tipo_almacen || 0);
    if (esBebidaUnitaria) return [1, 3].includes(a.tipo_almacen || 0);
    return true;
  });

  const almacenOptions = [
    { value: "", label: "-- Seleccione Almacén --" },
    ...almacenesFiltrados.map((alm) => ({ value: String(alm.id), label: alm.nombre })),
  ];

  const sinAlmacenesDisponibles = requiereAlmacen && almacenesFiltrados.length === 0;

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        title={producto ? `Editar: ${producto.nombre}` : "Nuevo Registro en Catálogo"}
        subtitle="Los parámetros se ajustan dinámicamente según el tipo seleccionado."
        isSaving={isSaving || uploadingImage}
        maxWidth="max-w-[720px]"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5 dark:border-gray-800">
              <Icon name="mdi:tag-outline" size={18} className="text-brand-600 dark:text-brand-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                1. Clasificación del Producto
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Tipo de Producto *</Label>
                <Select
                  options={tipoProductoOptions}
                  defaultValue={values.tipo_producto ? String(values.tipo_producto) : ""}
                  placeholder={isLoadingTipos ? "Cargando..." : "Seleccione tipo..."}
                  disabled={isSaving || isLoadingTipos}
                  error={Boolean(showError("tipo_producto"))}
                  hint={showError("tipo_producto")}
                  onChange={handleTipoProductoChange}
                />
              </div>

              <div>
                <Label htmlFor="codigo_interno">Código Interno *</Label>
                <Input
                  id="codigo_interno"
                  value={values.codigo_interno}
                  onChange={(e) => setValues((p) => ({ ...p, codigo_interno: e.target.value.toUpperCase() }))}
                  onBlur={() => handleBlur("codigo_interno")}
                  placeholder={getCodigoPlaceholder()}
                  error={Boolean(showError("codigo_interno"))}
                  hint={showError("codigo_interno")}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 w-full space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={values.nombre}
                    onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
                    onBlur={() => handleBlur("nombre")}
                    placeholder={getNombrePlaceholder()}
                    error={Boolean(showError("nombre"))}
                    hint={showError("nombre")}
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Categoría *</Label>
                    <Select
                      options={categoriaOptions}
                      defaultValue={selectedCategoriaId ? String(selectedCategoriaId) : ""}
                      placeholder="-- Seleccione Categoría --"
                      disabled={isSaving}
                      onChange={(val) => {
                        const catId = val ? Number(val) : null;
                        const subFilt = catId ? subcategorias.filter((s) => s.id_categoria === catId) : [];
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
                      placeholder={!selectedCategoriaId ? "Seleccione categoría primero" : "-- Seleccione Subcategoría --"}
                      disabled={isSaving || !selectedCategoriaId}
                      error={Boolean(showError("id_subcategoria"))}
                      hint={showError("id_subcategoria")}
                      onChange={(val) => {
                        setValues((p) => ({ ...p, id_subcategoria: Number(val) }));
                        handleBlur("id_subcategoria");
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-36 shrink-0">
                <Label>Imagen</Label>
                <div className="mt-1.5 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-2 text-center dark:border-gray-700 dark:bg-gray-900">
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div
                        onClick={() => setIsLightboxOpen(true)}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer group"
                        title="Clic para ver en tamaño grande"
                      >
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Icon name="mdi:magnify-plus-outline" size={18} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSaving || uploadingImage}
                          className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                        >
                          Cambiar
                        </button>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <button
                          type="button"
                          onClick={() => setShowConfirmRemoveImage(true)}
                          disabled={isSaving || uploadingImage}
                          className="font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="imagen_file" className="cursor-pointer flex flex-col items-center py-2 w-full">
                      <Icon name="mdi:image-plus" size={26} className="text-gray-400" />
                      <span className="mt-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                        Subir Foto
                      </span>
                    </label>
                  )}
                  <input
                    ref={fileInputRef}
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

            <div>
              <Label>Unidad de Medida Base * (Filtro con buscador)</Label>
              <Select
                options={unidadOptions}
                defaultValue={values.id_unidad_medida ? String(values.id_unidad_medida) : ""}
                placeholder="Seleccione unidad base..."
                searchPlaceholder="Filtrar unidad (ej. kg, oz, presa, pote)..."
                disabled={isSaving}
                error={Boolean(showError("id_unidad_medida"))}
                hint={showError("id_unidad_medida")}
                onChange={(val) => {
                  setValues((p) => ({ ...p, id_unidad_medida: Number(val) }));
                  handleBlur("id_unidad_medida");
                }}
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción / Observación (Opcional)</Label>
              <TextArea
                value={values.descripcion || ""}
                onChange={(val) => setValues((p) => ({ ...p, descripcion: val }))}
                placeholder="Detalles adicionales del producto..."
                disabled={isSaving}
                rows={2}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5 dark:border-gray-800">
              <Icon name="mdi:cog-outline" size={18} className="text-brand-600 dark:text-brand-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                2. Parámetros Operativos
              </h4>
            </div>

            {requiereAlmacen && (
              <div>
                <Label>Almacén de Stock *</Label>
                <Select
                  options={almacenOptions}
                  defaultValue={values.id_almacen_stock ? String(values.id_almacen_stock) : ""}
                  placeholder={sinAlmacenesDisponibles ? "Sin almacenes compatibles" : "Seleccione almacén..."}
                  disabled={isSaving || sinAlmacenesDisponibles}
                  error={Boolean(showError("id_almacen_stock"))}
                  hint={
                    showError("id_almacen_stock") ||
                    (sinAlmacenesDisponibles
                      ? "⚠️ No hay un almacén compatible creado para este tipo. Ve a Módulo Almacenes y registra uno."
                      : esCrudo
                      ? "Insumos crudos corresponden al Almacén Crudo."
                      : esProcesado
                      ? "Insumos procesados corresponden a Producción Cocina/Barra."
                      : "Bebidas unitarias descuentan stock directo del Almacén de Barra.")
                  }
                  onChange={(val) => setValues((p) => ({ ...p, id_almacen_stock: val ? Number(val) : null }))}
                />
              </div>
            )}

            {!esInsumo && (
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
                  <Label htmlFor="costo_receta">Costo Receta Calculado (S/)</Label>
                  <Input
                    id="costo_receta"
                    type="number"
                    value={costoReceta.toFixed(2)}
                    disabled
                    hint="Calculado automáticamente por la receta"
                  />
                </div>
              </div>
            )}

            {requiereEstacion && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Estación de Comanda / KDS *</Label>
                  <Select
                    options={estacionOptions}
                    defaultValue={values.id_estacion ? String(values.id_estacion) : ""}
                    placeholder="Seleccione estación..."
                    disabled={isSaving}
                    error={Boolean(showError("id_estacion"))}
                    hint={showError("id_estacion") || "Define la impresora o pantalla KDS de destino."}
                    onChange={(val) => setValues((p) => ({ ...p, id_estacion: val ? Number(val) : null }))}
                  />
                </div>

                {esPlatoOTrago && (
                  <div>
                    <Label htmlFor="tiempo_prep_min">Tiempo Prep. Estimado (Min.)</Label>
                    <Input
                      id="tiempo_prep_min"
                      type="number"
                      value={values.tiempo_prep_min ?? 15}
                      onChange={(e) => setValues((p) => ({ ...p, tiempo_prep_min: Number(e.target.value) }))}
                      placeholder="15"
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
              <Checkbox
                id="controla_stock"
                label="Controla Stock"
                checked={values.controla_stock}
                onChange={(checked) => setValues((p) => ({ ...p, controla_stock: checked }))}
                disabled={true}
              />

              <Checkbox
                id="disponible_venta"
                label="Disponible en Carta"
                checked={values.disponible_venta}
                onChange={(checked) => setValues((p) => ({ ...p, disponible_venta: checked }))}
                disabled={isSaving || esInsumo}
              />

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

      {isLightboxOpen && imagePreview && (
        <Modal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          className="max-w-[500px] p-4 text-center"
          showCloseButton={true}
        >
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {values.nombre || "Previsualización de Imagen"}
            </h4>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-black/40 p-1">
              <img
                src={imagePreview}
                alt="Vista ampliada"
                className="max-h-[380px] w-full object-contain rounded-lg mx-auto"
              />
            </div>
          </div>
        </Modal>
      )}

      {showConfirmRemoveImage && (
        <Modal
          isOpen={showConfirmRemoveImage}
          onClose={() => setShowConfirmRemoveImage(false)}
          className="max-w-[420px] p-6 text-center"
          showCloseButton={false}
        >
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <Icon name="mdi:alert-circle-outline" size={28} />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                ¿Quitar la foto seleccionada?
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Esta acción removerá la vista previa de la imagen. Los cambios se aplicarán al guardar el producto.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmRemoveImage(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemoveImage}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Sí, Quitar Foto
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}