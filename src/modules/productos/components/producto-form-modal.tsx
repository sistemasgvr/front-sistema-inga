"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import {
  useTiposProducto,
  TipoProductoFormModal,
  type TipoProducto,
} from "@/modules/tipos-producto";
import { aplicarReglasTipo } from "../utils/producto-reglas";
import { useProductoCatalogos } from "../hooks/use-producto-catalogos";
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
  isSaving,
}: ProductoFormModalProps) {
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(
    null,
  );
  const cat = useProductoCatalogos(isOpen, selectedCategoriaId);
  const unidades = cat.unidades.options,
    categorias = cat.categorias.options,
    subcategorias = cat.subcategorias.options,
    almacenes = cat.almacenes.options,
    estaciones = cat.estaciones.options;
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
  const [serverError, setServerError] = useState<string | null>(null);

  const tipos = useTiposProducto(isOpen);
  const [isTipoOpen, setIsTipoOpen] = useState(false);
  const tipoSeleccionado = tipos.options.find(
    (t) => Number(t.id) === Number(values.tipo_producto),
  );
  const permiteVenta = tipoSeleccionado?.permite_venta ?? false;
  const requiereReceta = tipoSeleccionado?.requiere_receta ?? false;
  const permiteStockInicial = tipoSeleccionado?.permite_stock_inicial ?? false;
  const requiereEstacion = tipoSeleccionado?.requiere_estacion ?? false;
  const requiereAlmacen = values.controla_stock;

  useEffect(() => {
    if (!isOpen) return;

    setIsTipoOpen(false);
    setSelectedFile(null);
    setShowConfirmRemoveImage(false);
    setServerError(null);

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

      const defaultTipo = 0;

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
        controla_stock: true,
        disponible_venta: false,
        tiempo_prep_min: 15,
        imagen_url: "",
      });
      setCostoReceta(0);
      setImagePreview(null);
    }
  }, [isOpen, producto]);

  const filteredSubcategorias = selectedCategoriaId
    ? subcategorias.filter((s) => s.id_categoria === selectedCategoriaId)
    : subcategorias;

  function seleccionarTipo(tipo: TipoProducto) {
    setValues((previous) =>
      aplicarReglasTipo(
        {
          ...previous,
          disponible_venta: tipo.permite_venta,
          stock_inicial: 0,
          costo_inicial: 0,
        },
        tipo,
      ),
    );
  }

  function handleTipoProductoChange(val: string) {
    const tipo = tipos.options.find((item) => Number(item.id) === Number(val));
    if (tipo) seleccionarTipo(tipo);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast(
        "error",
        "Formato inválido",
        "Solo se admiten imágenes JPG, PNG o WEBP.",
      );
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving || uploadingImage) return;
    setServerError(null);

    if (!tipoSeleccionado || tipos.isLoading || tipos.error) {
      setServerError(
        "Selecciona un tipo de producto válido y espera a que cargue el catálogo.",
      );
      return;
    }
    if (!values.codigo_interno.trim()) {
      setServerError("El código interno es obligatorio.");
      return;
    }
    if (!values.nombre.trim()) {
      setServerError("El nombre del producto es obligatorio.");
      return;
    }
    if (!values.id_subcategoria) {
      setServerError("Selecciona una subcategoría.");
      return;
    }
    if (!values.id_unidad_medida) {
      setServerError("Selecciona una unidad de medida base.");
      return;
    }
    if (requiereEstacion && !values.id_estacion) {
      setServerError("Debes asignar una estación de comandas/impresión.");
      return;
    }
    if (requiereAlmacen && !values.id_almacen_stock) {
      setServerError("Debes asignar un almacén de stock compatible.");
      return;
    }

    try {
      let finalImageUrl = values.imagen_url;

      if (selectedFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadProductoImagenApi(selectedFile);
      }

      const payload = aplicarReglasTipo(
        {
          ...values,
          imagen_url: finalImageUrl,
        },
        tipoSeleccionado,
      );

      await onSubmit(payload);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al procesar el registro.",
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

  const unidadOptions = unidades.map((u) => ({
    value: String(u.id),
    label: `${u.nombre} (${u.simbolo})`,
  }));

  const estacionOptions = [
    { value: "", label: "-- Seleccione Estación --" },
    ...estaciones.map((est) => ({ value: String(est.id), label: est.nombre })),
  ];

  const almacenesFiltrados = almacenes;

  const almacenOptions = [
    { value: "", label: "-- Seleccione Almacén --" },
    ...almacenesFiltrados.map((alm) => ({
      value: String(alm.id),
      label: alm.nombre,
    })),
  ];

  return (
    <>
      <FormModal
        isOpen={isOpen && !isTipoOpen}
        onClose={() => {
          if (!isTipoOpen && !isSaving && !uploadingImage) onClose();
        }}
        onSubmit={handleSubmit}
        title={producto ? `Editar: ${producto.nombre}` : "Nuevo Producto"}
        subtitle="Configura los datos del catálogo y sus parámetros operativos."
        submitDisabled={
          isTipoOpen || tipos.isLoading || !!tipos.error || !tipoSeleccionado
        }
        isSaving={isSaving || uploadingImage}
      >
        {serverError && (
          <Alert
            variant="error"
            title="No se pudo guardar"
            message={serverError}
          />
        )}

        <div>
          <Label>Imagen del Producto</Label>
          <div className="mt-1.5 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.02] p-4 text-center transition-colors">
            {imagePreview ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer group shadow-xs"
                  title="Clic para ver ampliada"
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Icon name="mdi:magnify-plus-outline" size={22} />
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-start text-center sm:text-start gap-1">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
                    {selectedFile ? selectedFile.name : "Imagen del producto"}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Imagen vinculada a la carta digital.
                  </span>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving || uploadingImage}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                    >
                      <Icon name="mdi:image-refresh" size={16} />
                      <span>Cambiar</span>
                    </button>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <button
                      type="button"
                      onClick={() => setShowConfirmRemoveImage(true)}
                      disabled={isSaving || uploadingImage}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                    >
                      <Icon name="mdi:trash-can-outline" size={16} />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-3 cursor-pointer group w-full"
              >
                <div className="rounded-full bg-brand-50 dark:bg-brand-500/10 p-3 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                  <Icon name="mdi:cloud-upload-outline" size={26} />
                </div>
                <span className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Haz clic para subir una foto
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Formatos admitidos: JPG, PNG o WEBP (Máx. 5 MB)
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Tipo de Producto *</Label>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Select
                  options={tipos.options.map((t) => ({
                    value: String(t.id),
                    label: t.nombre,
                  }))}
                  onOpen={() => void tipos.load()}
                  isLoading={tipos.isLoading}
                  loadError={tipos.error}
                  defaultValue={
                    values.tipo_producto ? String(values.tipo_producto) : ""
                  }
                  placeholder="Seleccione tipo..."
                  disabled={isSaving || isTipoOpen}
                  onChange={handleTipoProductoChange}
                />
              </div>
              <button
                type="button"
                aria-label="Añadir tipo de producto"
                title="Añadir tipo de producto"
                disabled={isSaving || uploadingImage || isTipoOpen}
                onClick={() => setIsTipoOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/10"
              >
                <Icon name="mdi:plus" size={22} />
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="codigo_interno">Código Interno *</Label>
            <Input
              id="codigo_interno"
              value={values.codigo_interno}
              onChange={(e) =>
                setValues((p) => ({
                  ...p,
                  codigo_interno: e.target.value.toUpperCase(),
                }))
              }
              placeholder="PROD-001"
              disabled={isSaving}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="nombre">Nombre del Producto *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) =>
              setValues((p) => ({ ...p, nombre: e.target.value }))
            }
            placeholder="Ej. Arroz con Pato Arequipeño / Gaseosa 500ml"
            disabled={isSaving}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Categoría *</Label>
            <Select
              options={categoriaOptions}
              onOpen={() => void cat.categorias.load()}
              isLoading={cat.categorias.isLoading}
              loadError={cat.categorias.error}
              defaultValue={
                selectedCategoriaId ? String(selectedCategoriaId) : ""
              }
              placeholder="-- Seleccione Categoría --"
              disabled={isSaving}
              onChange={(val) => {
                const catId = val ? Number(val) : null;

                setSelectedCategoriaId(catId);
                setValues((p) => ({ ...p, id_subcategoria: 0 }));
              }}
            />
          </div>

          <div>
            <Label>Subcategoría *</Label>
            <Select
              options={subcategoriaOptions}
              onOpen={() => void cat.subcategorias.load()}
              isLoading={cat.subcategorias.isLoading}
              loadError={cat.subcategorias.error}
              defaultValue={
                values.id_subcategoria ? String(values.id_subcategoria) : ""
              }
              placeholder={
                !selectedCategoriaId
                  ? "Seleccione categoría primero"
                  : "-- Seleccione Subcategoría --"
              }
              disabled={isSaving || !selectedCategoriaId}
              onChange={(val) =>
                setValues((p) => ({ ...p, id_subcategoria: Number(val) }))
              }
            />
          </div>
        </div>

        <div>
          <Label>Unidad de Medida Base *</Label>
          <Select
            options={unidadOptions}
            onOpen={() => void cat.unidades.load()}
            isLoading={cat.unidades.isLoading}
            loadError={cat.unidades.error}
            defaultValue={
              values.id_unidad_medida ? String(values.id_unidad_medida) : ""
            }
            placeholder="Seleccione unidad..."
            disabled={isSaving}
            onChange={(val) =>
              setValues((p) => ({ ...p, id_unidad_medida: Number(val) }))
            }
          />
        </div>

        {(permiteVenta || requiereReceta) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {permiteVenta && (
              <div>
                <Label htmlFor="precio_venta">Precio de Venta (S/) *</Label>
                <Input
                  id="precio_venta"
                  type="number"
                  step={0.01}
                  value={values.precio_venta}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      precio_venta: Number(e.target.value),
                    }))
                  }
                  placeholder="0.00"
                  disabled={isSaving}
                />
              </div>
            )}

            {requiereReceta && (
              <div>
                <Label htmlFor="costo_receta">
                  Costo Receta Calculado (S/)
                </Label>
                <Input
                  id="costo_receta"
                  type="number"
                  value={costoReceta.toFixed(2)}
                  disabled={true}
                />
              </div>
            )}
          </div>
        )}

        {requiereAlmacen && (
          <div>
            <Label>Almacén de Stock *</Label>
            <Select
              options={almacenOptions}
              onOpen={() => void cat.almacenes.load()}
              isLoading={cat.almacenes.isLoading}
              loadError={cat.almacenes.error}
              defaultValue={
                values.id_almacen_stock ? String(values.id_almacen_stock) : ""
              }
              placeholder="Seleccione almacén..."
              disabled={isSaving}
              onChange={(val) =>
                setValues((p) => ({
                  ...p,
                  id_almacen_stock: val ? Number(val) : null,
                }))
              }
            />
          </div>
        )}

        {!producto && values.controla_stock && (
          <div className="mt-4 space-y-2">
            <div
              className={`grid gap-4 ${!permiteStockInicial ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"}`}
            >
              <div>
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  step={0.0001}
                  value={values.stock_minimo ?? 0}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      stock_minimo: Number(e.target.value),
                    }))
                  }
                  disabled={isSaving}
                />
              </div>

              {permiteStockInicial && (
                <>
                  <div>
                    <Label>Stock inicial</Label>
                    <Input
                      type="number"
                      min="0"
                      step={0.0001}
                      value={values.stock_inicial ?? 0}
                      onChange={(e) =>
                        setValues((p) => ({
                          ...p,
                          stock_inicial: Number(e.target.value),
                        }))
                      }
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label>Costo por unidad (S/)</Label>
                    <Input
                      type="number"
                      min="0"
                      step={0.0001}
                      value={values.costo_inicial ?? 0}
                      onChange={(e) =>
                        setValues((p) => ({
                          ...p,
                          costo_inicial: Number(e.target.value),
                        }))
                      }
                      disabled={isSaving}
                    />
                  </div>
                </>
              )}
            </div>

            {requiereReceta && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Las porciones se descuentan según la receta configurada en
                Preparaciones.
              </p>
            )}
          </div>
        )}
        {(requiereEstacion || requiereReceta) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {requiereEstacion && (
              <div>
                <Label>Estación de Comanda / KDS *</Label>
                <Select
                  options={estacionOptions}
                  onOpen={() => void cat.estaciones.load()}
                  isLoading={cat.estaciones.isLoading}
                  loadError={cat.estaciones.error}
                  defaultValue={
                    values.id_estacion ? String(values.id_estacion) : ""
                  }
                  placeholder="Seleccione estación..."
                  disabled={isSaving}
                  onChange={(val) =>
                    setValues((p) => ({
                      ...p,
                      id_estacion: val ? Number(val) : null,
                    }))
                  }
                />
              </div>
            )}

            {requiereReceta && (
              <div>
                <Label htmlFor="tiempo_prep_min">
                  Prep. Estimada (Minutos)
                </Label>
                <Input
                  id="tiempo_prep_min"
                  type="number"
                  value={values.tiempo_prep_min ?? 15}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      tiempo_prep_min: Number(e.target.value),
                    }))
                  }
                  disabled={isSaving}
                />
              </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="descripcion">Descripción / Notas (Opcional)</Label>
          <TextArea
            value={values.descripcion || ""}
            onChange={(val) => setValues((p) => ({ ...p, descripcion: val }))}
            placeholder="Detalles o notas sobre el producto..."
            disabled={isSaving}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          <Checkbox
            id="controla_stock"
            label="Controla Stock"
            checked={values.controla_stock}
            onChange={(checked) =>
              setValues((p) => ({
                ...p,
                controla_stock: checked,
                ...(checked
                  ? {}
                  : {
                      id_almacen_stock: null,
                      stock_inicial: 0,
                      stock_minimo: 0,
                      costo_inicial: 0,
                    }),
              }))
            }
            disabled={isSaving}
          />

          <Checkbox
            id="disponible_venta"
            label="Disponible en Carta"
            checked={values.disponible_venta}
            onChange={(checked) =>
              setValues((p) => ({ ...p, disponible_venta: checked }))
            }
            disabled={isSaving || !permiteVenta}
          />

          <Checkbox
            id="afecto_igv"
            label="Afecto a IGV"
            checked={values.afecto_igv}
            onChange={(checked) =>
              setValues((p) => ({ ...p, afecto_igv: checked }))
            }
            disabled={isSaving}
          />
        </div>
      </FormModal>

      {isOpen && isTipoOpen && (
        <TipoProductoFormModal
          onClose={() => setIsTipoOpen(false)}
          onCreated={(tipo) => {
            seleccionarTipo(tipo);
            setIsTipoOpen(false);
            void tipos.load();
          }}
        />
      )}

      {isLightboxOpen && imagePreview && (
        <Modal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          className="max-w-[450px] p-4 text-center"
          showCloseButton={false}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
              <h4 className="col-start-2 break-words text-sm font-bold text-gray-900 dark:text-white">
                {values.nombre || "Previsualización"}
              </h4>
              <button type="button" aria-label="Cerrar imagen" onClick={() => setIsLightboxOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
                <Icon name="mdi:close" size={24} />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-black/5 p-1">
              <img
                src={imagePreview}
                alt="Ampliada"
                className="max-h-[350px] w-full object-contain rounded-lg mx-auto"
              />
            </div>
          </div>
        </Modal>
      )}

      {showConfirmRemoveImage && (
        <Modal
          isOpen={showConfirmRemoveImage}
          onClose={() => setShowConfirmRemoveImage(false)}
          className="max-w-[380px] p-5 text-center"
          showCloseButton={false}
        >
          <div className="space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30">
              <Icon name="mdi:alert-circle-outline" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                ¿Quitar la foto?
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Se quitará la foto previa. Aplica al guardar el producto.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmRemoveImage(false)}
                className="rounded-xl border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemoveImage}
                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
              >
                Sí, Quitar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
