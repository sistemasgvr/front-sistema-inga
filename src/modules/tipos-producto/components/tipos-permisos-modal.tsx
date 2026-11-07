"use client";

import { useState } from "react";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { ToastNotification } from "@/components/ui/toast/ToastNotification";
import { useTiposPermisos } from "../hooks/use-tipos-permisos";
import { contarPermisos, PERMISOS_TIPO } from "../utils/tipo-permisos";

export function TiposPermisosModal({
  onClose,
  onUpdated,
}: {
  onClose: () => void;
  onUpdated: () => void;
}) {
  const arbol = useTiposPermisos(onUpdated);
  const [colapsados, setColapsados] = useState<ReadonlySet<number>>(new Set());
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const ocupado = arbol.savingId !== null;

  function alternar(id: number) {
    setColapsados((actuales) => {
      const siguientes = new Set(actuales);
      if (!siguientes.delete(id)) siguientes.add(id);
      return siguientes;
    });
  }

  // Escape también llega aquí con un diálogo encima: ese diálogo es el que debe cerrarse.
  function cerrar() {
    if (ocupado || arbol.pendiente || confirmarCierre) return;
    if (arbol.hayBorradores) setConfirmarCierre(true);
    else onClose();
  }

  return (
    <>
      <Modal isOpen onClose={cerrar} className="max-w-[560px] p-0 overflow-hidden flex flex-col">
        <div className="flex flex-col max-h-[85vh]">
          <div className="px-6 pt-6 pb-4 pr-14 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Permisos de tipos de producto
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Define qué permite cada tipo. Los productos existentes no se modifican al guardar.
            </p>
          </div>

          <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-3">
            {arbol.error && (
              <ToastNotification variant="error" title="No se pudo guardar" message={arbol.error} />
            )}
            {arbol.isLoading && (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Cargando tipos...
              </p>
            )}
            {arbol.loadError && (
              <div className="py-8 text-center">
                <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{arbol.loadError}</p>
                <Button size="sm" variant="outline" onClick={() => void arbol.recargar()}>
                  Reintentar
                </Button>
              </div>
            )}
            {!arbol.isLoading && !arbol.loadError && arbol.nodos.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Aún no hay tipos de producto.
              </p>
            )}

            <ul className="space-y-1">
              {arbol.nodos.map(({ tipo, actual, modificado }) => {
                const abierto = !colapsados.has(tipo.id);
                const guardando = arbol.savingId === tipo.id;
                return (
                  <li key={tipo.id}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-expanded={abierto}
                        aria-controls={`permisos_tipo_${tipo.id}`}
                        onClick={() => alternar(tipo.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <Icon
                          name="mdi:chevron-right"
                          size={18}
                          className={`shrink-0 text-gray-400 transition-transform ${abierto ? "rotate-90" : ""}`}
                        />
                        <span className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                          {tipo.nombre}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          {contarPermisos(actual)} de {PERMISOS_TIPO.length}
                        </span>
                      </button>
                      {modificado && (
                        <Button
                          size="sm"
                          disabled={ocupado}
                          onClick={() => void arbol.guardar(tipo)}
                          startIcon={
                            guardando ? <Icon name="mdi:loading" size={16} className="animate-spin" /> : undefined
                          }
                        >
                          {guardando ? "Guardando..." : "Guardar"}
                        </Button>
                      )}
                    </div>
                    {abierto && (
                      <ul
                        id={`permisos_tipo_${tipo.id}`}
                        className="ml-[17px] mb-2 space-y-2.5 border-l border-gray-200 py-1.5 pl-5 dark:border-gray-700"
                      >
                        {PERMISOS_TIPO.map(({ clave, etiqueta }) => {
                          const bloqueado = clave === "permite_stock_inicial" && actual.requiere_receta;
                          return (
                            <li
                              key={clave}
                              title={bloqueado ? "No disponible en tipos que requieren receta" : undefined}
                            >
                              <Checkbox
                                id={`tipo_${tipo.id}_${clave}`}
                                label={etiqueta}
                                checked={actual[clave]}
                                disabled={ocupado || bloqueado}
                                onChange={(activo) => arbol.cambiar(tipo, clave, activo)}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="px-6 py-4 flex justify-end border-t border-gray-100 dark:border-gray-800 shrink-0">
            <Button size="sm" variant="outline" disabled={ocupado} onClick={cerrar}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={arbol.pendiente !== null}
        onClose={arbol.cancelarPendiente}
        onConfirm={arbol.confirmarPendiente}
        isLoading={ocupado}
        variant="warning"
        title={`¿Guardar permisos de ${arbol.pendiente?.tipo.nombre ?? ""}?`}
        description={arbol.pendiente?.avisos.join(" ") ?? ""}
        confirmText="Guardar de todos modos"
      />
      <ConfirmDialog
        isOpen={confirmarCierre}
        onClose={() => setConfirmarCierre(false)}
        onConfirm={onClose}
        variant="warning"
        title="¿Descartar cambios?"
        description="Hay tipos con cambios sin guardar."
        confirmText="Descartar"
        cancelText="Seguir editando"
      />
    </>
  );
}
