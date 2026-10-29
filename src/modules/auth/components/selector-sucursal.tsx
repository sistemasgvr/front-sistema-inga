"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast/ToastContext";
import { cambiarSucursal, getSucursalActiva, getStoredUser } from "../services/auth.service";
import type { SucursalUsuario } from "../types/auth.types";

/**
 * «Trabajando en»: sucursal activa de la sesión. Solo se muestra si el usuario tiene
 * más de una; al cambiar, recarga la vista para traer los datos de la nueva sucursal.
 */
export function SelectorSucursal() {
  const { toast } = useToast();
  const [sucursales, setSucursales] = useState<SucursalUsuario[]>([]);
  const [activa, setActiva] = useState<number | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getStoredUser();
    queueMicrotask(() => {
      setSucursales(user?.sucursales ?? []);
      setActiva(getSucursalActiva(user));
    });
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  if (sucursales.length < 2) return null;
  const actual = sucursales.find((s) => s.id === activa) ?? sucursales[0];

  async function elegir(id: number) {
    setAbierto(false);
    if (id === actual.id || cambiando) return;
    setCambiando(true);
    try {
      await cambiarSucursal(id);
      window.location.reload();
    } catch (e) {
      toast("error", "No se pudo cambiar de sucursal", e instanceof Error ? e.message : "Inténtalo de nuevo.");
      setCambiando(false);
    }
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        disabled={cambiando}
        title="Sucursal en la que estás trabajando"
        className="flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Icon name="mdi:store-marker-outline" size={18} />
        <span className="hidden text-xs text-gray-400 sm:inline">Trabajando en</span>
        <span className="max-w-[140px] truncate">{cambiando ? "Cambiando..." : actual.nombre}</span>
        <Icon name="mdi:chevron-down" size={16} />
      </button>
      {abierto && (
        <ul role="listbox" aria-label="Sucursales"
          className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          {sucursales.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                role="option"
                aria-selected={s.id === actual.id}
                onClick={() => void elegir(s.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${s.id === actual.id
                  ? "bg-brand-50 font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
              >
                <span className="truncate">
                  {s.nombre}
                  {s.es_predeterminada && <span className="ml-1 text-xs font-normal text-gray-400">(predeterminada)</span>}
                </span>
                {s.id === actual.id && <Icon name="mdi:check" size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
