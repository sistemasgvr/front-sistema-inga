"use client";

import { useErrorNotification } from "@/shared/hooks/use-error-notification";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import type { UnidadMedidaItem } from "@/modules/productos/types/productos.types";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FORMA_PAGO,
  FORMAS_PAGO,
  type AlmacenCompra,
  type CategoriaInsumos,
  type InsumoItem,
  type LineaFormValues,
  type ProductoInventario,
  type TipoItemCompra,
} from "../types/gdo.types";
import { formatearCantidad, formatearSoles } from "../utils/formato";

type LineaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LineaFormValues) => Promise<void>;
  categorias: CategoriaInsumos[];
  /** Productos del inventario: comprarlos ingresa stock. */
  productos: ProductoInventario[];
  almacenes: AlmacenCompra[];
  unidades: UnidadMedidaItem[];
  proveedores: PersonaBusquedaItem[];
  turnoAbierto: TurnoItem | null;
  /** Abre el modal de crear insumo sin cerrar este. */
  onCrearInsumo: () => void;
  isSaving: boolean;
};

const TIPOS_ITEM: {
  valor: TipoItemCompra;
  etiqueta: string;
  detalle: string;
  icono: string;
}[] = [
  {
    valor: "inventario",
    etiqueta: "Producto del inventario",
    detalle: "Aumenta el stock del almacén",
    icono: "mdi:package-variant-closed-plus",
  },
  {
    valor: "insumo",
    etiqueta: "Otro producto",
    detalle: "Solo gasto, no ingresa al stock",
    icono: "mdi:basket-outline",
  },
];

const VALORES_INICIALES: LineaFormValues = {
  tipo_item: "inventario",
  id_insumo: null,
  id_producto: null,
  id_almacen: null,
  cantidad: 1,
  precio_unitario: 0,
  forma_pago: FORMA_PAGO.EFECTIVO,
  id_unidad_medida: null,
  id_proveedor: null,
  observacion: "",
};

/**
 * Registra una compra del día. Es el formulario que más se usa del módulo:
 * el cajero lo abre muchas veces por jornada, así que está pensado para ser
 * rápido.
 *
 * Cuatro decisiones de UX:
 *
 * 1. **Al elegir el insumo se autocompleta el precio** con el último pagado y,
 *    si tiene proveedor habitual, también ese. El cajero solo confirma.
 *
 * 2. **El subtotal se calcula en vivo.** Es lo que va al cuadre del día y debe
 *    verse antes de guardar, no después.
 *
 * 3. **La forma de pago son tres botones con su consecuencia escrita**
 *    ("sale del cajón", "genera deuda al proveedor"). Es la decisión que más
 *    impacto tiene y conviene que sea imposible equivocarse.
 *
 * 4. **"No está en la lista" abre el alta de insumo** sin perder lo escrito.
 *    Es el requisito del alcance de crear productos al vuelo.
 *
 * 5. **Primero se elige qué se compra:** un producto del inventario (la compra
 *    le suma stock en su unidad base, aunque hoy esté en cero) u otro producto
 *    de la lista libre, que solo cuenta como gasto y no entra al almacén.
 */
export function LineaFormModal({
  isOpen,
  onClose,
  onSubmit,
  categorias,
  productos,
  almacenes,
  unidades,
  proveedores,
  turnoAbierto,
  onCrearInsumo,
  isSaving,
}: LineaFormModalProps) {
  const [values, setValues] = useState<LineaFormValues>(VALORES_INICIALES);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const notifyError = useErrorNotification("Error");

  const hayTurno = Boolean(turnoAbierto);
  const turnoCerrado = turnoAbierto?.estado_turno === 2;
  const puedeEfectivo = hayTurno && !turnoCerrado;
  const hayProductos = productos.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    setValues({
      ...VALORES_INICIALES,
      // Sin productos de inventario no tiene sentido arrancar en esa pestaña.
      tipo_item: hayProductos ? "inventario" : "insumo",
      // Sin turno el efectivo no es viable: arranco en Yape.
      forma_pago: puedeEfectivo ? FORMA_PAGO.EFECTIVO : FORMA_PAGO.YAPE,
    });
    setIntentoEnviar(false);

  }, [isOpen, puedeEfectivo, hayProductos]);

  const esInventario = values.tipo_item === "inventario";

  function cambiarTipo(tipo: TipoItemCompra) {
    // Al cambiar de tipo limpio lo elegido del otro, para no mandar ambos.
    setValues((p) => ({
      ...p,
      tipo_item: tipo,
      id_insumo: null,
      id_producto: null,
      id_almacen: null,
      id_unidad_medida: null,
      precio_unitario: 0,
    }));
    setIntentoEnviar(false);
  }

  /** Almacén por defecto: el habitual del producto, si no el principal. */
  const almacenPorDefecto = useMemo(
    () => almacenes.find((a) => a.es_principal)?.id ?? almacenes[0]?.id ?? null,
    [almacenes],
  );

  const opcionesProducto = useMemo(
    () =>
      productos.map((p) => {
        const unidad = p.simbolo_unidad ?? p.nombre_unidad;
        const stock = Number(p.stock_total);
        return {
          value: String(p.id),
          // El stock a la vista: los que están en cero son los que hay que comprar.
          label:
            stock > 0
              ? `${p.nombre} — stock ${formatearCantidad(stock)} ${unidad}`
              : `${p.nombre} — sin stock`,
        };
      }),
    [productos],
  );

  const productoElegido =
    productos.find((p) => p.id === values.id_producto) ?? null;
  const almacenElegido =
    almacenes.find((a) => a.id === values.id_almacen) ?? null;
  const stockEnAlmacen = Number(
    productoElegido?.stocks.find((s) => s.id_almacen === values.id_almacen)
      ?.stock_actual ?? 0,
  );

  /** Al elegir producto, sugiero almacén y precio (su costo promedio). */
  function elegirProducto(id: number) {
    const producto = productos.find((p) => p.id === id);
    setValues((p) => ({
      ...p,
      id_producto: id,
      id_almacen: producto?.id_almacen_stock ?? almacenPorDefecto,
      id_unidad_medida: producto?.id_unidad_medida ?? null,
      precio_unitario:
        p.precio_unitario > 0
          ? p.precio_unitario
          : Number(producto?.costo_referencial) || 0,
    }));
  }

  /** Aplano el árbol para el selector, con la categoría como prefijo. */
  const opcionesInsumo = useMemo(() => {
    const opciones: { value: string; label: string }[] = [];
    categorias.forEach((cat) => {
      cat.insumos.forEach((ins) => {
        opciones.push({
          value: String(ins.id),
          label: `${ins.nombre}  ·  ${cat.nombre}`,
        });
      });
    });
    return opciones;
  }, [categorias]);

  const insumoElegido: InsumoItem | null = useMemo(() => {
    for (const cat of categorias) {
      const encontrado = cat.insumos.find((i) => i.id === values.id_insumo);
      if (encontrado) return encontrado;
    }
    return null;
  }, [categorias, values.id_insumo]);

  /**
   * Al elegir insumo, autocompleto precio y proveedor habitual.
   * No piso un precio ya escrito: el precio real puede diferir del referencial.
   */
  function elegirInsumo(id: number) {

    let encontrado: InsumoItem | null = null;
    for (const cat of categorias) {
      const i = cat.insumos.find((x) => x.id === id);
      if (i) {
        encontrado = i;
        break;
      }
    }

    setValues((p) => ({
      ...p,
      id_insumo: id,
      precio_unitario:
        p.precio_unitario > 0
          ? p.precio_unitario
          : Number(encontrado?.precio_referencial) || 0,
      id_proveedor: p.id_proveedor ?? encontrado?.id_proveedor_habitual ?? null,
    }));
  }

  const subtotal = values.cantidad * values.precio_unitario;
  const esCredito = values.forma_pago === FORMA_PAGO.CREDITO;
  const esEfectivo = values.forma_pago === FORMA_PAGO.EFECTIVO;

  const errorInsumo =
    intentoEnviar && !esInventario && !values.id_insumo
      ? "Selecciona el producto."
      : undefined;
  const errorProducto =
    intentoEnviar && esInventario && !values.id_producto
      ? "Selecciona el producto del inventario."
      : undefined;
  const errorAlmacen =
    intentoEnviar && esInventario && !values.id_almacen
      ? "Elige a qué almacén entra."
      : undefined;
  const errorCantidad =
    intentoEnviar && values.cantidad <= 0
      ? "La cantidad debe ser mayor a cero."
      : undefined;
  const errorProveedor =
    intentoEnviar && esCredito && !values.id_proveedor
      ? "Una compra a crédito debe indicar a qué proveedor se le debe."
      : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);

    if (esInventario && (!values.id_producto || !values.id_almacen)) return;
    if (!esInventario && !values.id_insumo) return;
    if (values.cantidad <= 0) return;
    if (esCredito && !values.id_proveedor) return;

    try {
      await onSubmit(values);
    } catch (error) {
      notifyError(
        error instanceof Error ? error.message : "No se pudo registrar la compra.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Registrar compra del día"
      subtitle="Productos e insumos comprados hoy para la operación de cocina."
      isSaving={isSaving}
      submitText="Agregar al día"
    >

      <div>
        <Label>¿Qué se compró? *</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {TIPOS_ITEM.map((opcion) => {
            const activo = values.tipo_item === opcion.valor;
            const bloqueado = opcion.valor === "inventario" && !hayProductos;
            return (
              <button
                key={opcion.valor}
                type="button"
                disabled={isSaving || bloqueado}
                onClick={() => cambiarTipo(opcion.valor)}
                title={
                  bloqueado
                    ? "No hay productos que controlen stock en el inventario"
                    : undefined
                }
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                  activo
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Icon
                  name={opcion.icono}
                  size={22}
                  className={activo ? "text-brand-500" : "text-gray-400"}
                />
                <span>
                  <span className="block text-xs font-semibold text-gray-800 dark:text-white/90">
                    {opcion.etiqueta}
                  </span>
                  <span className="block text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                    {opcion.detalle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {esInventario ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="id_producto">Producto *</Label>
            <Select
              options={opcionesProducto}
              defaultValue={values.id_producto ? String(values.id_producto) : ""}
              placeholder="Busca el producto..."
              onChange={(value) => elegirProducto(Number(value))}
              disabled={isSaving}
              error={Boolean(errorProducto)}
              hint={errorProducto}
            />
          </div>

          <div>
            <Label htmlFor="id_almacen">Ingresa al almacén *</Label>
            <Select
              options={almacenes.map((a) => ({
                value: String(a.id),
                label: a.nombre,
              }))}
              defaultValue={values.id_almacen ? String(values.id_almacen) : ""}
              placeholder="Elige el almacén"
              onChange={(value) => {
                setValues((p) => ({ ...p, id_almacen: Number(value) }));
              }}
              disabled={isSaving || !values.id_producto}
              error={Boolean(errorAlmacen)}
              hint={errorAlmacen}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="id_insumo">Producto *</Label>
            <button
              type="button"
              onClick={onCrearInsumo}
              disabled={isSaving}
              className="mb-1.5 flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              <Icon name="mdi:plus-circle-outline" size={14} />
              No está en la lista
            </button>
          </div>
          <Select
            options={opcionesInsumo}
            defaultValue={values.id_insumo ? String(values.id_insumo) : ""}
            placeholder="Busca el producto..."
            onChange={(value) => elegirInsumo(Number(value))}
            disabled={isSaving}
            error={Boolean(errorInsumo)}
            hint={
              errorInsumo ??
              (opcionesInsumo.length === 0
                ? "La lista está vacía. Agrégalos desde el enlace de arriba."
                : "No ingresa al inventario: solo cuenta como gasto del día.")
            }
          />
        </div>
      )}

      {/* Cuánto stock hay y con cuánto queda: confirma que la compra suma. */}
      {esInventario && productoElegido && almacenElegido && (
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-xs text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          <Icon name="mdi:package-variant-closed-plus" size={18} />
          <span>
            Stock en {almacenElegido.nombre}:{" "}
            <span className="font-semibold">
              {formatearCantidad(stockEnAlmacen)}
            </span>
            {values.cantidad > 0 && (
              <>
                {" "}→ quedará en{" "}
                <span className="font-semibold">
                  {formatearCantidad(stockEnAlmacen + values.cantidad)}{" "}
                  {productoElegido.simbolo_unidad ?? productoElegido.nombre_unidad}
                </span>
              </>
            )}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="cantidad">Cantidad *</Label>
          <Input
            id="cantidad"
            type="number"
            step={0.01}
            min="0"
            value={values.cantidad || ""}
            onChange={(e) => {

              setValues((p) => ({ ...p, cantidad: Number(e.target.value) || 0 }));
            }}
            error={Boolean(errorCantidad)}
            hint={errorCantidad}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="id_unidad_medida">Unidad</Label>
          {esInventario ? (
            // El kardex solo acepta la unidad base del producto: no se elige.
            <Input
              id="id_unidad_medida"
              value={
                productoElegido
                  ? productoElegido.simbolo_unidad
                    ? `${productoElegido.nombre_unidad} (${productoElegido.simbolo_unidad})`
                    : productoElegido.nombre_unidad
                  : ""
              }
              placeholder="Del producto"
              disabled
              hint="La del inventario."
            />
          ) : (
          <Select
            options={unidades.map((u) => ({
              value: String(u.id),
              label: u.simbolo ? `${u.nombre} (${u.simbolo})` : u.nombre,
            }))}
            defaultValue={
              values.id_unidad_medida ? String(values.id_unidad_medida) : ""
            }
            placeholder="Elige la unidad"
            onChange={(value) => {

              setValues((p) => ({
                ...p,
                id_unidad_medida: value ? Number(value) : null,
              }));
            }}
            disabled={isSaving}
            // El alcance es explícito: el insumo no tiene unidad fija, se
            // define en cada compra. Lo digo acá para que no extrañe.
            hint="Se elige en cada compra: el mismo insumo varía."
          />
          )}
        </div>

        <div>
          <Label htmlFor="precio_unitario">Precio unitario (S/) *</Label>
          <Input
            id="precio_unitario"
            type="number"
            step={0.01}
            min="0"
            value={values.precio_unitario || ""}
            onChange={(e) => {

              setValues((p) => ({
                ...p,
                precio_unitario: Number(e.target.value) || 0,
              }));
            }}
            placeholder="0.00"
            hint={
              esInventario
                ? productoElegido && Number(productoElegido.costo_referencial) > 0
                  ? `Costo promedio: ${formatearSoles(productoElegido.costo_referencial)}`
                  : undefined
                : insumoElegido && Number(insumoElegido.precio_referencial) > 0
                  ? `Último: ${formatearSoles(insumoElegido.precio_referencial)}`
                  : undefined
            }
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Subtotal en vivo: es lo que va al cuadre del día. */}
      {subtotal > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            Subtotal de esta compra
          </span>
          <span className="text-xl font-bold text-brand-700 dark:text-brand-300">
            {formatearSoles(subtotal)}
          </span>
        </div>
      )}

      <div>
        <Label>¿Cómo se pagó? *</Label>
        <div className="grid grid-cols-3 gap-2.5">
          {FORMAS_PAGO.map((opcion) => {
            const activo = values.forma_pago === opcion.valor;
            const bloqueado =
              opcion.valor === FORMA_PAGO.EFECTIVO && !puedeEfectivo;

            return (
              <button
                key={opcion.valor}
                type="button"
                disabled={isSaving || bloqueado}
                onClick={() => {

                  setValues((p) => ({ ...p, forma_pago: opcion.valor }));
                }}
                title={
                  bloqueado
                    ? "Necesitas un turno de caja abierto para pagar en efectivo"
                    : undefined
                }
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
                  activo
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Icon
                  name={opcion.icono}
                  size={20}
                  className={activo ? "text-brand-500" : "text-gray-400"}
                />
                <span className="text-xs font-semibold text-gray-800 dark:text-white/90">
                  {opcion.etiqueta}
                </span>
                <span className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                  {opcion.detalle}
                </span>
              </button>
            );
          })}
        </div>

        {esEfectivo && turnoAbierto && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Icon name="mdi:cash-register" size={14} />
            Sale del cajón de{" "}
            <span className="font-semibold">{turnoAbierto.nombre_caja}</span> ·
            disponible {formatearSoles(turnoAbierto.efectivo_esperado ?? 0)}
          </p>
        )}
      </div>

      {/* El proveedor solo aparece cuando la compra es a crédito: es la misma
          regla que valida el backend, pero acá simplemente no ofrezco la
          opción imposible. */}
      {esCredito && (
        <div>
          <Label htmlFor="id_proveedor">Proveedor *</Label>
          <Select
            options={proveedores.map((p) => ({
              value: String(p.id),
              label: p.nombre_completo ?? `Proveedor ${p.id}`,
            }))}
            defaultValue={values.id_proveedor ? String(values.id_proveedor) : ""}
            placeholder="¿A quién se le debe?"
            onChange={(value) => {

              setValues((p) => ({ ...p, id_proveedor: Number(value) }));
            }}
            disabled={isSaving}
            error={Boolean(errorProveedor)}
            hint={
              errorProveedor ??
              (proveedores.length === 0
                ? "No hay proveedores. Regístralos en Personas y márcalos como proveedor."
                : "Se generará la deuda automáticamente en Cuentas por Pagar.")
            }
          />
        </div>
      )}

      <div>
        <Label htmlFor="observacion">Observación</Label>
        <Input
          id="observacion"
          value={values.observacion}
          onChange={(e) => {

            setValues((p) => ({ ...p, observacion: e.target.value }));
          }}
          placeholder="Opcional"
          disabled={isSaving}
        />
      </div>
    </FormModal>
  );
}
