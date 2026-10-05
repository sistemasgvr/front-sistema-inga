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
  const [serverError, setServerError] = useState<string | null>(null);

  const tipo = Number(values.tipo_producto);
  const esCrudo = tipo === 1;
  const esProcesado = tipo === 2;
  const esPlatoOTrago = [3, 4, 5].includes(tipo);
  const esInsumo = esCrudo || esProcesado;
  const requiereEstacion = [3, 4, 5, 6].includes(tipo);
  const requiereAlmacen = esInsumo || tipo === 6 || values.controla_stock;

  useEffect(() => {
    if (!isOpen) return;

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
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("error", "Formato inválido", "Solo se admiten imágenes JPG, PNG o WEBP.");
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

  function sanearPayloadPorTipo(raw: ProductoFormValues): ProductoFormValues {
    const t = Number(raw.tipo_producto);

    switch (t) {
      case 1:
      case 2:
        return {
          ...raw,
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
    setServerError(null);

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

      const payload = sanearPayloadPorTipo({
        ...values,
        imagen_url: finalImageUrl,
      });

      await onSubmit(payload);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Ocurrió un error al procesar el registro."
      );
    } finally {
      setUploadingImage(false);
    }
  }

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
    if (tipo === 6) return [1, 3].includes(a.tipo_almacen || 0);
    return true;
  });

  const almacenOptions = [
    { value: "", label: "-- Seleccione Almacén --" },
    ...almacenesFiltrados.map((alm) => ({ value: String(alm.id), label: alm.nombre })),
  ];

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        title={producto ? `Editar: ${producto.nombre}` : "Nuevo Producto"}
        subtitle="Configura los datos del catálogo y sus parámetros operativos."
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
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
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
            <Select
              options={tipoProductoOptions}
              defaultValue={values.tipo_producto ? String(values.tipo_producto) : ""}
              placeholder={isLoadingTipos ? "Cargando..." : "Seleccione tipo..."}
              disabled={isSaving}
              onChange={handleTipoProductoChange}
            />
          </div>

          <div>
            <Label htmlFor="codigo_interno">Código Interno *</Label>
            <Input
              id="codigo_interno"
              value={values.codigo_interno}
              onChange={(e) => setValues((p) => ({ ...p, codigo_interno: e.target.value.toUpperCase() }))}
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
            onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej. Arroz con Pato Arequipeño / Gaseosa 500ml"
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
              onChange={(val) => setValues((p) => ({ ...p, id_subcategoria: Number(val) }))}
            />
          </div>
        </div>

        <div>
          <Label>Unidad de Medida Base *</Label>
          <Select
            options={unidadOptions}
            defaultValue={values.id_unidad_medida ? String(values.id_unidad_medida) : ""}
            placeholder="Seleccione unidad..."
            disabled={isSaving}
            onChange={(val) => setValues((p) => ({ ...p, id_unidad_medida: Number(val) }))}
          />
        </div>

        {!esInsumo && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="precio_venta">Precio de Venta (S/) *</Label>
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
                disabled={true}
              />
            </div>
          </div>
        )}

        {requiereAlmacen && (
          <div>
            <Label>Almacén de Stock *</Label>
            <Select
              options={almacenOptions}
              defaultValue={values.id_almacen_stock ? String(values.id_almacen_stock) : ""}
              placeholder="Seleccione almacén..."
              disabled={isSaving}
              onChange={(val) => setValues((p) => ({ ...p, id_almacen_stock: val ? Number(val) : null }))}
            />
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
                onChange={(val) => setValues((p) => ({ ...p, id_estacion: val ? Number(val) : null }))}
              />
            </div>

            {esPlatoOTrago && (
              <div>
                <Label htmlFor="tiempo_prep_min">Prep. Estimada (Minutos)</Label>
                <Input
                  id="tiempo_prep_min"
                  type="number"
                  value={values.tiempo_prep_min ?? 15}
                  onChange={(e) => setValues((p) => ({ ...p, tiempo_prep_min: Number(e.target.value) }))}
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
      </FormModal>

      {isLightboxOpen && imagePreview && (
        <Modal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          className="max-w-[450px] p-4 text-center"
          showCloseButton={true}
        >
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {values.nombre || "Previsualización"}
            </h4>
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