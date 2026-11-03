"use client";

import {
  filtrarNavegacion,
  navItems,
  rutasNavegables,
} from "@/config/navegacion";
import { Icon } from "@/components/ui/icon";
import { useDebounce } from "@/hooks/useDebounce";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { buscarPersonas } from "@/modules/personas/services/personas.service";
import { listProductos } from "@/modules/productos/services/productos.service";
import { listVentas } from "@/modules/ventas/services/ventas.service";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import { solicitarBusqueda } from "@/shared/hooks/use-busqueda-desde-url";
import {
  normalizarTexto,
  puntajeCoincidencia,
} from "@/shared/utils/busqueda";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import type { ProductoItem } from "@/modules/productos/types/productos.types";
import type { VentaItem } from "@/modules/ventas/types/ventas.types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Mínimo de caracteres para consultar al backend (la navegación filtra desde 1). */
const MINIMO_API = 2;
/** Resultados por grupo. Más que esto es una lista, no una sugerencia. */
const POR_GRUPO = 6;

type Grupo = "Ir a" | "Productos" | "Clientes" | "Ventas";

type Resultado = {
  id: string;
  grupo: Grupo;
  titulo: string;
  detalle?: string;
  icono: string;
  ruta: string;
};

type ResultadosApi = {
  productos: ProductoItem[];
  personas: PersonaBusquedaItem[];
  ventas: VentaItem[];
};

const VACIO: ResultadosApi = { productos: [], personas: [], ventas: [] };

function soles(monto: number | null | undefined): string | null {
  if (monto == null) return null;
  return `S/ ${Number(monto).toFixed(2)}`;
}

function unir(...partes: (string | null | undefined)[]): string {
  return partes.filter(Boolean).join(" · ");
}

/**
 * Buscador del header.
 *
 * Dos fuentes con la misma tecla:
 * - Navegación: la lista del sidebar ya cargada en cliente, filtrada por
 *   permisos. Instantánea y sin red.
 * - Entidades: `buscar` de productos, clientes y ventas. El backend ya expone
 *   ese filtro en los listados, así que no hay endpoint nuevo; se pide con
 *   debounce y se cancela la petición anterior.
 *
 * Cada resultado abre el listado con el término ya aplicado (`?buscar=`).
 */
export default function BuscadorGlobal() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [activo, setActivo] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<ResultadosApi>(VACIO);

  const contenedor = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  const debounced = useDebounce(texto, 300);

  const usuario = useMemo(() => getStoredUser(), []);
  const permisos = useMemo(() => usuario?.permisos ?? [], [usuario]);

  const tiene = useCallback(
    (permiso?: string | string[]) => {
      if (!permiso) return true;
      if (usuario?.es_super_admin) return true;
      return Array.isArray(permiso)
        ? permiso.some((p) => permisos.includes(p))
        : permisos.includes(permiso);
    },
    [usuario, permisos],
  );

  const puedeProductos = tiene(PermisoBanderas.PRODUCTOS_LISTAR);
  const puedePersonas = tiene(PermisoBanderas.PERSONAS_LISTAR);
  const puedeVentas = tiene(PermisoBanderas.VENTAS_LISTAR);

  const rutas = useMemo(
    () => rutasNavegables(filtrarNavegacion(navItems, tiene)),
    [tiene],
  );

  const cerrar = useCallback(() => {
    setAbierto(false);
    setTexto("");
    setApi(VACIO);
    setCargando(false);
    setError(null);
    setActivo(0);
  }, []);

  const abrirResultado = useCallback(
    (resultado: Resultado) => {
      cerrar();
      // Si la vista destino ya está montada (misma ruta), no habrá montaje que
      // lea el `?buscar=`: se le avisa antes de navegar.
      const destino = new URL(resultado.ruta, window.location.origin);
      const termino = destino.searchParams.get("buscar");
      if (termino) solicitarBusqueda(destino.pathname, termino);
      router.push(resultado.ruta);
    },
    [cerrar, router],
  );

  // Abre con Ctrl/Cmd+K desde cualquier pantalla.
  useEffect(() => {
    const atajo = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setAbierto(true);
      }
    };
    document.addEventListener("keydown", atajo);
    return () => document.removeEventListener("keydown", atajo);
  }, []);

  // Clic fuera: cierra. Escape: cierra y devuelve el foco al botón.
  useEffect(() => {
    if (!abierto) return;

    inputRef.current?.focus();

    const fuera = (event: MouseEvent) => {
      if (!contenedor.current?.contains(event.target as Node)) cerrar();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cerrar();
      requestAnimationFrame(() => botonRef.current?.focus());
    };

    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto, cerrar]);

  // Consulta a la API: solo grupos permitidos, con debounce y cancelación.
  useEffect(() => {
    const termino = debounced.trim();
    if (!abierto || termino.length < MINIMO_API) return;

    const ctrl = new AbortController();
    let vigente = true;

    void (async () => {
      // El primer setState va después del await a propósito: el cuerpo de un
      // efecto no debe disparar renders en cascada (regla set-state-in-effect).
      await Promise.resolve();
      if (!vigente) return;

      setCargando(true);
      setError(null);

      try {
        const [productos, personas, ventas] = await Promise.all([
          puedeProductos
            ? listProductos(
                {
                  pagina: 1,
                  limite: POR_GRUPO,
                  buscar: termino,
                  estado: "activos",
                },
                ctrl.signal,
              ).then((r) => r.registros)
            : Promise.resolve<ProductoItem[]>([]),
          puedePersonas
            ? buscarPersonas(termino, "todos", POR_GRUPO, ctrl.signal)
            : Promise.resolve<PersonaBusquedaItem[]>([]),
          puedeVentas
            ? listVentas(
                { pagina: 1, limite: POR_GRUPO, buscar: termino },
                ctrl.signal,
              ).then((r) => r.registros)
            : Promise.resolve<VentaItem[]>([]),
        ]);

        if (!vigente) return;
        setApi({ productos, personas, ventas });
      } catch (e) {
        if (!vigente || ctrl.signal.aborted) return;
        setApi(VACIO);
        setError(
          e instanceof Error ? e.message : "No se pudo completar la búsqueda",
        );
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => {
      vigente = false;
      ctrl.abort();
    };
  }, [abierto, debounced, puedeProductos, puedePersonas, puedeVentas]);

  const grupos = useMemo(() => {
    const busqueda = normalizarTexto(texto);

    // Sin texto se ofrecen las rutas principales; con texto se filtran.
    const navegacion = busqueda
      ? rutas
          .map((ruta) => ({
            ruta,
            puntos: puntajeCoincidencia(
              ruta.nombre,
              ruta.seccion ?? "",
              busqueda,
            ),
          }))
          .filter((x) => x.puntos > 0)
          .sort((a, b) => b.puntos - a.puntos)
          .slice(0, POR_GRUPO)
          .map((x) => x.ruta)
      : rutas.slice(0, POR_GRUPO);

    const consultaActiva = busqueda.length >= MINIMO_API;

    const irA: Resultado[] = navegacion.map((ruta) => ({
      id: `nav:${ruta.ruta}`,
      grupo: "Ir a",
      titulo: ruta.seccion ? `${ruta.seccion} › ${ruta.nombre}` : ruta.nombre,
      icono: ruta.icono,
      ruta: ruta.ruta,
    }));

    const productos: Resultado[] = (consultaActiva ? api.productos : []).map(
      (producto) => ({
        id: `producto:${producto.id}`,
        grupo: "Productos",
        titulo: producto.nombre,
        detalle: unir(
          producto.nombre_categoria,
          soles(producto.precio_venta),
        ),
        icono: "mdi:silverware-fork-knife",
        ruta: `/productos?buscar=${encodeURIComponent(producto.nombre)}`,
      }),
    );

    const clientes: Resultado[] = (consultaActiva ? api.personas : []).map(
      (persona) => ({
        id: `persona:${persona.id}`,
        grupo: "Clientes",
        titulo:
          persona.nombre_completo ??
          persona.num_documento ??
          `Persona ${persona.id}`,
        detalle: unir(
          persona.num_documento,
          persona.es_cliente ? "Cliente" : null,
          persona.es_proveedor ? "Proveedor" : null,
        ),
        icono: "mdi:account-outline",
        ruta: `/personas?buscar=${encodeURIComponent(
          persona.nombre_completo ?? persona.num_documento ?? "",
        )}`,
      }),
    );

    const ventas: Resultado[] = (consultaActiva ? api.ventas : []).map(
      (venta) => ({
        id: `venta:${venta.id}`,
        grupo: "Ventas",
        titulo: venta.numero_comprobante ?? venta.codigo,
        detalle: unir(venta.nombre_cliente, soles(venta.monto_total)),
        icono: "mdi:receipt-text-outline",
        ruta: `/ventas?buscar=${encodeURIComponent(venta.codigo)}`,
      }),
    );

    return [
      { titulo: "Ir a" as Grupo, items: irA },
      { titulo: "Productos" as Grupo, items: productos },
      { titulo: "Clientes" as Grupo, items: clientes },
      { titulo: "Ventas" as Grupo, items: ventas },
    ].filter((grupo) => grupo.items.length > 0);
  }, [texto, rutas, api]);

  const items = useMemo(() => grupos.flatMap((grupo) => grupo.items), [grupos]);
  const indices = useMemo(
    () => new Map(items.map((item, indice) => [item.id, indice])),
    [items],
  );

  // El índice activo se acota en lectura: si la lista se acorta, no queda fuera.
  const indiceActivo = items.length ? Math.min(activo, items.length - 1) : 0;

  // Pendiente = el texto va por delante de la respuesta (debounce o request).
  const pendiente = texto.trim() !== debounced.trim() || cargando;
  const mostrarPanel =
    abierto && (items.length > 0 || pendiente || error !== null);

  function manejarTeclas(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cerrar();
      requestAnimationFrame(() => botonRef.current?.focus());
      return;
    }
    if (!items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActivo((indiceActivo + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActivo((indiceActivo - 1 + items.length) % items.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const elegido = items[indiceActivo];
      if (elegido) abrirResultado(elegido);
    }
  }

  return (
    <div ref={contenedor} className="relative hidden lg:block">
      <div
        className={`flex h-11 items-center overflow-hidden rounded-full border border-gray-200 bg-white transition-[width] duration-300 ease-out dark:border-gray-800 dark:bg-gray-900 ${
          abierto ? "w-[18rem] xl:w-[22rem]" : "w-11"
        }`}
      >
        {abierto ? (
          <div className="relative flex w-full items-center">
            <span className="pointer-events-none absolute left-3.5 text-gray-400 dark:text-gray-500">
              <Icon name="mdi:magnify" size={18} />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={(event) => {
                setTexto(event.target.value);
                setActivo(0);
              }}
              onKeyDown={manejarTeclas}
              placeholder="Buscar platos, clientes, ventas..."
              role="combobox"
              aria-expanded={mostrarPanel}
              aria-controls="buscador-global-resultados"
              aria-autocomplete="list"
              aria-label="Buscar en el sistema"
              className="h-11 w-full bg-transparent pr-11 pl-10 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden dark:text-white/90 dark:placeholder:text-white/30"
            />
            {cargando && (
              <span
                className="absolute right-10 h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar buscador"
              className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <Icon name="mdi:close" size={16} />
            </button>
          </div>
        ) : (
          <button
            ref={botonRef}
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Buscar"
            title="Buscar (Ctrl+K)"
            className="flex h-11 w-11 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <Icon name="mdi:magnify" size={20} />
          </button>
        )}
      </div>

      {mostrarPanel && (
        <div
          id="buscador-global-resultados"
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="shadow-theme-lg absolute top-full left-0 z-50 mt-2 w-[26rem] max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="max-h-[22rem] overflow-y-auto">
            {grupos.map((grupo) => (
              <div key={grupo.titulo} role="group" aria-label={grupo.titulo}>
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                  {grupo.titulo}
                </p>
                {grupo.items.map((item) => {
                  const indice = indices.get(item.id) ?? 0;
                  const seleccionado = indice === indiceActivo;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={seleccionado}
                      onMouseEnter={() => setActivo(indice)}
                      onClick={() => abrirResultado(item)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        seleccionado
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        <Icon name={item.icono} size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {item.titulo}
                        </span>
                        {item.detalle && (
                          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                            {item.detalle}
                          </span>
                        )}
                      </span>
                      {seleccionado && (
                        <Icon
                          name="mdi:arrow-right"
                          size={16}
                          className="shrink-0 text-gray-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {error && (
              <p className="px-3 py-2 text-xs text-error-500">{error}</p>
            )}

            {!items.length && pendiente && !error && (
              <p className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                Buscando...
              </p>
            )}

            {!items.length && !pendiente && !error && (
              <p className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                Sin coincidencias para «{texto.trim()}».
              </p>
            )}
          </div>

          <div className="mt-1 flex items-center justify-between border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400 dark:border-gray-800">
            <span>↑ ↓ para mover · Enter para abrir</span>
            <span>Esc para cerrar</span>
          </div>
        </div>
      )}
    </div>
  );
}
