"use client";

import { useCallback, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import { NavTabs } from "@/components/ui/table/NavTabs";
import { LISTA_IDS, useLista } from "@/modules/listas";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { useCarta, useAdicionalesCarta } from "../hooks/use-carta";
import { listarCategoriasCarta, listarSubcategoriasCarta } from "../services/carta.service";
import type { AgregarItemValues, FiltrosCarta, ProductoOption } from "../types/mesas.types";

interface AgregarItemModalProps {
  isOpen: boolean;
  canAdd: boolean;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (items: AgregarItemValues[]) => Promise<{ ok: boolean; guardados: number }>;
  /** Contenido a la derecha de la carta (ej. el resumen del pedido). */
  sidePanel?: ReactNode;
  /** Si es false, al guardar se limpia la lista y el modal sigue abierto. */
  closeOnSave?: boolean;
  title?: string;
  /** Confirmación obligatoria al cerrar (reemplaza la de productos sin guardar). */
  closeConfirmMessage?: string;
}

// Enter en un input no debe enviar el formulario (guardaría la lista por accidente).
const bloquearEnter = (e: KeyboardEvent) => {
  if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault();
};

type LineaPendiente = {
  key: number;
  producto: ProductoOption;
  cantidad: number;
  observacion: string;
  adicionales: { id: number; nombre: string; precio: number }[];
};

const money = (value: number) => `S/ ${Number(value).toFixed(2)}`;
const importeLinea = (l: LineaPendiente) => (Number(l.producto.precio_venta) + l.adicionales.reduce((t, a) => t + a.precio, 0)) * l.cantidad;
const firmaLinea = (l: Pick<LineaPendiente, "producto" | "observacion" | "adicionales">) =>
  `${l.producto.id}|${l.observacion}|${l.adicionales.map(a => a.id).sort((a, b) => a - b).join(",")}`;

export function AgregarItemModal(props: AgregarItemModalProps) {
  if (!props.isOpen) return null;
  return <CartaContent {...props} />;
}

function CartaContent({ isOpen, canAdd, isSaving, error, onClose, onSubmit, sidePanel, closeOnSave = true, title = "Añadir platos y adicionales", closeConfirmMessage }: AgregarItemModalProps) {
  const carta = useCarta();
  const tipos = useLista(LISTA_IDS.PRODUCTO_TIPO);
  const categorias = useLazyOptions(listarCategoriasCarta);
  const [seleccionado, setSeleccionado] = useState<ProductoOption | null>(null);
  const [revision, setRevision] = useState(0);
  const [cantidad, setCantidad] = useState("1");
  const [observacion, setObservacion] = useState("");
  const [adicionales, setAdicionales] = useState<number[]>([]);
  const [success, setSuccess] = useState("");
  const [lineas, setLineas] = useState<LineaPendiente[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const extras = useAdicionalesCarta(seleccionado?.id ?? null, revision);
  const cantidadValida = Number.isInteger(Number(cantidad)) && Number(cantidad) >= 1 && Number(cantidad) <= 999;
  const tabs = [{ id: "", label: "Toda la carta" }, ...tipos.opciones
    .filter(t => t.valor_entero !== null && ["PLATO_CARTA", "PLATO_MENU", "TRAGO", "BEBIDA_UNITARIA", "ADICIONAL"].includes(t.codigo))
    .map(t => ({ id: String(t.valor_entero), label: t.nombre }))];

  const cambiarFiltro = (cambio: Partial<FiltrosCarta>) => {
    carta.cambiar(cambio);
    setSeleccionado(null);
    setAdicionales([]);
    setSuccess("");
  };
  const seleccionar = (producto: ProductoOption) => {
    setSeleccionado(producto);
    setRevision(value => value + 1);
    setCantidad("1");
    setObservacion("");
    setAdicionales([]);
    setSuccess("");
  };
  const precioExtras = extras.opciones.filter(a => adicionales.includes(Number(a.id))).reduce((total, a) => total + Number(a.precio_adicional), 0);
  const importe = seleccionado && cantidadValida ? (Number(seleccionado.precio_venta) + precioExtras) * Number(cantidad) : 0;

  const puedeAgregarALista = canAdd && !!seleccionado && cantidadValida && !extras.isLoading && !extras.error;
  const totalLista = lineas.reduce((total, l) => total + importeLinea(l), 0);
  const unidadesLista = lineas.reduce((total, l) => total + l.cantidad, 0);

  function agregarALista() {
    if (!puedeAgregarALista || !seleccionado) return;
    const nueva: LineaPendiente = {
      key: nextKey,
      producto: seleccionado,
      cantidad: Number(cantidad),
      observacion: observacion.trim(),
      adicionales: extras.opciones.filter(a => adicionales.includes(Number(a.id))).map(a => ({ id: Number(a.id), nombre: a.nombre, precio: Number(a.precio_adicional) })),
    };
    setNextKey(k => k + 1);
    // Si ya existe la misma línea (producto + adicionales + observación), solo suma la cantidad.
    setLineas(previous => {
      const igual = previous.find(l => firmaLinea(l) === firmaLinea(nueva));
      if (!igual) return [...previous, nueva];
      return previous.map(l => l === igual ? { ...l, cantidad: Math.min(999, l.cantidad + nueva.cantidad) } : l);
    });
    setSuccess(`${nueva.cantidad} × ${nueva.producto.nombre} agregado a la lista.`);
    setSeleccionado(null);
    setAdicionales([]);
    setObservacion("");
    setCantidad("1");
  }

  const cambiarCantidadLinea = (key: number, delta: number) =>
    setLineas(previous => previous.map(l => l.key === key ? { ...l, cantidad: Math.min(999, Math.max(1, l.cantidad + delta)) } : l));
  const quitarLinea = (key: number) => setLineas(previous => previous.filter(l => l.key !== key));

  function cerrar() {
    if (isSaving) return;
    const mensaje = closeConfirmMessage
      ?? (lineas.length ? "Hay productos en la lista que aún no se guardaron. ¿Deseas cerrar y descartarlos?" : null);
    if (mensaje && !window.confirm(mensaje)) return;
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canAdd || isSaving || !lineas.length) return;
    const { ok, guardados } = await onSubmit(lineas.map(l => ({
      id_producto: Number(l.producto.id),
      cantidad: l.cantidad,
      observacion: l.observacion || undefined,
      adicionales: l.adicionales.map(a => ({ id_adicional: a.id })),
    })));
    if (ok) {
      if (closeOnSave) { onClose(); return; }
      setSuccess(`${unidadesLista} producto(s) guardados en el pedido.`);
      setLineas([]);
      return;
    }
    // Guardado parcial: quita de la lista lo que ya se registró para no duplicarlo al reintentar.
    if (guardados) {
      setLineas(previous => previous.slice(guardados));
      setSuccess(`${guardados} producto(s) ya se guardaron en el pedido. Revisa el error y vuelve a guardar los restantes.`);
    }
  }

  return <FormModal isOpen={isOpen} onClose={cerrar} onSubmit={submit}
    title={title} subtitle="Agrega todos los productos a la lista y luego guárdalos en el pedido."
    maxWidth={sidePanel ? "max-w-[1500px]" : "max-w-[1100px]"} isSaving={isSaving} cancelText="Cerrar"
    submitText={lineas.length ? `Guardar en el pedido (${unidadesLista}) · ${money(totalLista)}` : "Guardar en el pedido"}
    submitDisabled={!canAdd || !lineas.length}>
    <div className={sidePanel ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]" : undefined}>
    <div className="min-w-0 space-y-4">
    {!canAdd && <Alert variant="info" title="Consulta de carta" message="Selecciona una mesa y abre un pedido para añadir productos. Puedes consultar la carta mientras tanto." />}
    {error && <Alert variant="error" title="No se pudo añadir" message={error} />}
    {success && <Alert variant="success" title="Lista actualizada" message={success} />}
    <fieldset disabled={isSaving} className="min-w-0 space-y-4" onKeyDown={bloquearEnter}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label htmlFor="buscar-carta">Buscar en la carta</Label><Input id="buscar-carta" value={carta.filtros.buscar} placeholder="Nombre, código o descripción..." onChange={e => cambiarFiltro({ buscar: e.target.value })} /></div>
        <div><Label>Categoría</Label><Select options={[{ value: "", label: "Todas las categorías" }, ...categorias.options.map(c => ({ value: String(c.id), label: c.nombre }))]}
          defaultValue={carta.filtros.id_categoria} onOpen={() => void categorias.load()} isLoading={categorias.isLoading} loadError={categorias.error}
          onChange={id_categoria => cambiarFiltro({ id_categoria, id_subcategoria: "" })} /></div>
        <div><Label>Subcategoría</Label><SubcategoriaSelect key={carta.filtros.id_categoria} idCategoria={carta.filtros.id_categoria} value={carta.filtros.id_subcategoria}
          onChange={id_subcategoria => cambiarFiltro({ id_subcategoria })} /></div>
      </div>
      {tipos.error && <div className="flex items-center gap-3 text-sm text-error-500"><span>{tipos.error}</span><Button size="sm" variant="outline" onClick={tipos.recargar}>Reintentar tipos</Button></div>}
      {tipos.isLoading && <p role="status" className="text-xs text-gray-500">Cargando tipos de producto...</p>}
      <NavTabs tabs={tabs} activeTab={carta.filtros.tipo_producto} onChange={(value: string) => cambiarFiltro({ tipo_producto: String(value) })} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-3 flex justify-between text-xs text-gray-500"><span>{carta.isLoading ? "Consultando carta..." : `${carta.productos.length} productos`}</span><span>Stock informativo</span></div>
          <div className="max-h-[440px] overflow-y-auto pr-1">
            {carta.isLoading ? <div role="status" className="py-16 text-center text-sm text-gray-500">Cargando productos...</div>
              : carta.error ? <div className="space-y-3"><Alert variant="error" title="No se pudo cargar la carta" message={carta.error} /><Button size="sm" variant="outline" onClick={carta.recargar}>Reintentar</Button></div>
              : !carta.productos.length ? <div className="py-16 text-center text-sm text-gray-500">No hay productos disponibles con estos filtros.</div>
              : <div className="grid gap-3 sm:grid-cols-2">{carta.productos.map(producto => <ProductoCartaCard key={producto.id} producto={producto} selected={seleccionado?.id === producto.id} onSelect={() => seleccionar(producto)} />)}</div>}
          </div>
        </div>
        <aside className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          {!seleccionado ? <div className="py-6 text-center text-gray-500"><Icon name="mdi:food-fork-drink" size={36} className="mx-auto mb-3 text-brand-500" /><p className="text-sm">Selecciona un producto para indicar la cantidad y sus adicionales.</p></div>
            : <div className="space-y-4">
              <div><h5 className="font-semibold text-gray-900 dark:text-white">{seleccionado.nombre}</h5><p className="mt-1 text-sm text-brand-600">{money(seleccionado.precio_venta)} por unidad</p></div>
              <div><Label htmlFor="cantidad-carta">Cantidad solicitada</Label><div className="flex items-center gap-2">
                <button type="button" aria-label="Disminuir cantidad" className="h-11 w-11 shrink-0 rounded-lg border border-gray-300 dark:border-gray-700 dark:text-white" disabled={Number(cantidad) <= 1} onClick={() => setCantidad(String(Math.max(1, (Number(cantidad) || 1) - 1)))}>−</button>
                <Input id="cantidad-carta" type="number" value={cantidad} min="1" max="999" step={1} onChange={e => setCantidad(e.target.value)} error={!cantidadValida} />
                <button type="button" aria-label="Aumentar cantidad" className="h-11 w-11 shrink-0 rounded-lg border border-gray-300 dark:border-gray-700 dark:text-white" disabled={Number(cantidad) >= 999} onClick={() => setCantidad(String(Math.min(999, (Number(cantidad) || 0) + 1)))}>+</button>
              </div>{!cantidadValida && <p className="mt-1 text-xs text-error-500">Ingresa una cantidad entera entre 1 y 999.</p>}</div>
              {seleccionado.stock_disponible != null && Number(cantidad) > Number(seleccionado.stock_disponible) && <p className="text-xs text-warning-600">La cantidad supera el stock informado. Se validará al comandar.</p>}
              <div><Label>Adicionales para este producto</Label>
                {extras.isLoading ? <p role="status" className="text-xs text-gray-500">Consultando adicionales...</p> : extras.error ? <div className="text-xs text-error-500"><p>{extras.error}</p><button type="button" className="mt-1 underline" onClick={() => setRevision(v => v + 1)}>Reintentar</button></div>
                  : extras.opciones.length ? <div className="space-y-3">{extras.opciones.map(a => <Checkbox key={a.id} label={`${a.nombre} (+ ${money(a.precio_adicional)})`} checked={adicionales.includes(Number(a.id))}
                    onChange={checked => setAdicionales(previous => checked ? [...previous, Number(a.id)] : previous.filter(id => id !== Number(a.id)))} />)}<p className="text-xs text-gray-500">Se aplica una unidad de cada adicional por cada producto solicitado. Para cantidades distintas, añade líneas separadas.</p></div>
                    : <p className="text-xs text-gray-500">Sin adicionales configurados.</p>}
              </div>
              <div><Label>Observación</Label><TextArea value={observacion} onChange={setObservacion} rows={2} placeholder="Sin sal, término de cocción..." /></div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-sm dark:border-gray-700"><span className="text-gray-500">Importe de carta</span><strong className="text-brand-600">{money(importe)}</strong></div>
              <Button size="sm" className="w-full" onClick={agregarALista} disabled={!puedeAgregarALista} startIcon={<Icon name="mdi:playlist-plus" size={18} />}>Agregar a la lista</Button>
            </div>}
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex items-center justify-between"><h6 className="text-sm font-semibold text-gray-900 dark:text-white">Por guardar</h6><span className="text-xs text-gray-500">{unidadesLista} und.</span></div>
          {!lineas.length ? <p className="text-xs text-gray-500">Aún no hay productos en la lista.</p>
            : <ul className="max-h-[220px] space-y-2 overflow-y-auto pr-1">{lineas.map(l => <li key={l.key} className="rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="truncate font-medium text-gray-900 dark:text-white">{l.producto.nombre}</p>
                  {l.adicionales.length > 0 && <p className="text-xs text-gray-500">{l.adicionales.map(a => `+ ${a.nombre}`).join(", ")}</p>}
                  {l.observacion && <p className="text-xs italic text-gray-500">{l.observacion}</p>}</div>
                <button type="button" aria-label={`Quitar ${l.producto.nombre}`} className="shrink-0 rounded p-1 text-gray-400 hover:text-error-500" onClick={() => quitarLinea(l.key)}><Icon name="mdi:trash-can-outline" size={16} /></button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Disminuir" className="h-7 w-7 rounded border border-gray-300 dark:border-gray-600 dark:text-white" disabled={l.cantidad <= 1} onClick={() => cambiarCantidadLinea(l.key, -1)}>−</button>
                  <span className="w-8 text-center dark:text-white">{l.cantidad}</span>
                  <button type="button" aria-label="Aumentar" className="h-7 w-7 rounded border border-gray-300 dark:border-gray-600 dark:text-white" disabled={l.cantidad >= 999} onClick={() => cambiarCantidadLinea(l.key, 1)}>+</button>
                </div>
                <span className="font-semibold text-brand-600">{money(importeLinea(l))}</span>
              </div>
            </li>)}</ul>}
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-sm dark:border-gray-700"><span className="text-gray-500">Total de la lista</span><strong className="text-brand-600">{money(totalLista)}</strong></div>
          <p className="mt-1 text-xs text-gray-500">El resumen del pedido mostrará los impuestos y el total definitivo.</p>
        </div>
        </aside>
      </div>
    </fieldset>
    </div>
    {sidePanel && <div className="min-w-0" onKeyDown={bloquearEnter}>{sidePanel}</div>}
    </div>
  </FormModal>;
}

function SubcategoriaSelect({ idCategoria, value, onChange }: { idCategoria: string; value: string; onChange: (value: string) => void }) {
  const loader = useCallback((signal: AbortSignal) => listarSubcategoriasCarta(idCategoria, signal), [idCategoria]);
  const opciones = useLazyOptions(loader);
  return <Select disabled={!idCategoria} defaultValue={value} options={[{ value: "", label: "Todas las subcategorías" }, ...opciones.options.map(c => ({ value: String(c.id), label: c.nombre }))]}
    onOpen={() => void opciones.load()} isLoading={opciones.isLoading} loadError={opciones.error} onChange={onChange} placeholder="Selecciona una categoría" />;
}

function ProductoCartaCard({ producto, selected, onSelect }: { producto: ProductoOption; selected: boolean; onSelect: () => void }) {
  const stock = producto.stock_disponible;
  return <button type="button" onClick={onSelect} aria-pressed={selected}
    className={`flex min-h-36 flex-col rounded-xl border p-4 text-left transition-colors ${selected ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900"}`}>
    <span className="mb-2 text-xs text-gray-500">{producto.nombre_categoria} · {producto.nombre_subcategoria}</span>
    <span className="font-semibold text-gray-900 dark:text-white">{producto.nombre}</span>
    <span className="mt-3 flex w-full flex-wrap items-center justify-between gap-2"><span className="font-semibold text-brand-600">{money(producto.precio_venta)}</span>
      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{stock == null ? "Stock: sin información" : `Stock: ${stock} ${producto.simbolo_unidad ?? ""}`}</span></span>
  </button>;
}
