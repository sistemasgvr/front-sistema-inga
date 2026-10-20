"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { ColaImpresionModal, useEstacionImpresion } from "@/modules/impresion";
import type { EstacionItem } from "../types/estaciones.types";

export type EstacionPermisos = {
  editar: boolean;
  cambiarEstado: boolean;
  imprimir: boolean;
};

type EstacionAccionesProps = {
  estacion: EstacionItem;
  permisos: EstacionPermisos;
  isLoading: boolean;
  onEdit: (item: EstacionItem) => void;
  onToggleStatus: (item: EstacionItem) => void;
  onMarcarPrincipal: (id: number) => void;
};

type Posicion = { top?: number; bottom?: number; right: number };

export function EstacionAcciones({ estacion, permisos, isLoading, onEdit, onToggleStatus, onMarcarPrincipal }: EstacionAccionesProps) {
  const { busy, pendientes, probar, imprimirHojaPrueba, resolver, descargar, verCola, cerrarCola } = useEstacionImpresion(estacion);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActivo = estacion.estado === 1;
  const conImpresora = isActivo && !!estacion.impresora_ip;
  const puedePrincipal = permisos.editar && isActivo && !estacion.es_caja_principal;

  useEffect(() => {
    if (!posicion) return;
    const cerrar = () => setPosicion(null);
    const fuera = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !botonRef.current?.contains(target)) cerrar();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") cerrar(); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [posicion]);

  // El menú se monta en <body> para que la tabla (overflow oculto) no lo recorte.
  function alternarMenu() {
    if (posicion) return setPosicion(null);
    const rect = botonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const right = window.innerWidth - rect.right;
    setPosicion(window.innerHeight - rect.bottom < 280 ? { bottom: window.innerHeight - rect.top + 4, right } : { top: rect.bottom + 4, right });
  }

  function ejecutar(accion: () => void) {
    setPosicion(null);
    accion();
  }

  const hayMenu = permisos.imprimir || puedePrincipal || permisos.cambiarEstado;

  if (!permisos.editar && !hayMenu) {
    return <span className="text-xs italic text-gray-400">Protegido</span>;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {permisos.editar && isActivo && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onEdit(estacion)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 disabled:opacity-30 dark:hover:bg-gray-800"
          title="Editar estación"
        >
          <Icon name="mdi:pencil-outline" size={18} />
        </button>
      )}

      {hayMenu && (
        <button
          ref={botonRef}
          type="button"
          disabled={isLoading}
          onClick={alternarMenu}
          aria-haspopup="menu"
          aria-expanded={!!posicion}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 dark:hover:bg-gray-800 dark:hover:text-white ${posicion ? "bg-gray-100 dark:bg-gray-800" : ""}`}
          title="Más acciones"
        >
          <Icon name={busy ? "mdi:loading" : "mdi:dots-vertical"} size={18} className={busy ? "animate-spin" : ""} />
        </button>
      )}

      {posicion && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: posicion.top, bottom: posicion.bottom, right: posicion.right }}
          className="z-99999 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 text-left shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        >
          {permisos.imprimir && (
            <MenuGrupo titulo="Impresora">
              <MenuItem icono="mdi:lan-connect" disabled={busy || !conImpresora} onClick={() => ejecutar(() => void probar())}>Probar conexión</MenuItem>
              <MenuItem icono="mdi:printer-outline" disabled={busy || !conImpresora} onClick={() => ejecutar(() => void imprimirHojaPrueba())}>Imprimir hoja de prueba</MenuItem>
              <MenuItem icono="mdi:format-list-checks" disabled={busy} onClick={() => ejecutar(() => void verCola())}>Ver cola de impresión</MenuItem>
            </MenuGrupo>
          )}
          {puedePrincipal && (
            <MenuGrupo>
              <MenuItem
                icono="mdi:cash-register"
                disabled={!estacion.impresora_ip}
                onClick={() => ejecutar(() => onMarcarPrincipal(estacion.id))}
                hint={!estacion.impresora_ip ? "Requiere impresora con IP" : undefined}
              >
                Usar para caja y cobros
              </MenuItem>
            </MenuGrupo>
          )}
          {permisos.cambiarEstado && (
            <MenuGrupo>
              <MenuItem
                icono={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"}
                tono={isActivo ? "peligro" : "exito"}
                onClick={() => ejecutar(() => onToggleStatus(estacion))}
              >
                {isActivo ? "Desactivar estación" : "Activar estación"}
              </MenuItem>
            </MenuGrupo>
          )}
        </div>,
        document.body,
      )}

      <ColaImpresionModal
        estacion={estacion}
        pendientes={pendientes}
        busy={busy}
        onClose={cerrarCola}
        onResolver={(item, enviado) => void resolver(item, enviado)}
        onDescargar={(item) => void descargar(item)}
      />
    </div>
  );
}

function MenuGrupo({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <div className="border-t border-gray-100 py-1 first:border-t-0 dark:border-gray-800">
      {titulo && <p className="px-3.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{titulo}</p>}
      {children}
    </div>
  );
}

type MenuItemProps = {
  icono: string;
  onClick: () => void;
  disabled?: boolean;
  tono?: "normal" | "peligro" | "exito";
  hint?: string;
  children: ReactNode;
};

function MenuItem({ icono, onClick, disabled = false, tono = "normal", hint, children }: MenuItemProps) {
  const color = {
    normal: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]",
    peligro: "text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10",
    exito: "text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10",
  }[tono];
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      title={hint}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${color}`}
    >
      <Icon name={icono} size={18} className="shrink-0 opacity-80" />
      {children}
    </button>
  );
}
