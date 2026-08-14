"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { PermisoItem, RoleItem } from "../types/roles.types";

type RolePermissionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedIds: number[]) => Promise<void>;
  role: RoleItem | null;
  catalog: PermisoItem[];
  initialSelectedIds: number[];
  isLoading: boolean;
  isSaving: boolean;
};

export function RolePermissionsModal({
  isOpen,
  onClose,
  onSubmit,
  role,
  catalog,
  initialSelectedIds,
  isLoading,
  isSaving,
}: RolePermissionsModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
    }
  }, [isOpen, initialSelectedIds]);

  // Agrupar catálogo de permisos por propiedad 'modulo'
  const groupedPermissions = catalog.reduce<Record<string, PermisoItem[]>>(
    (acc, item) => {
      const mod = item.modulo || "GENERAL";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(item);
      return acc;
    },
    {},
  );

  function handleTogglePermission(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function handleToggleModule(modulePermissions: PermisoItem[]) {
    const moduleIds = modulePermissions.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...moduleIds])));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(selectedIds);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <div className="mb-6 border-b border-gray-100 pb-4 dark:border-gray-800">
          <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Matriz de Permisos — {role?.nombre}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Marca o desmarca los privilegios asignados a este rol agrupados por módulo.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Cargando matriz de permisos...
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
            {Object.entries(groupedPermissions).map(([modulo, items]) => {
              const moduleIds = items.map((p) => p.id);
              const isAllModuleSelected = moduleIds.every((id) =>
                selectedIds.includes(id),
              );

              return (
                <div
                  key={modulo}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/40"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-gray-200/60 pb-2 dark:border-gray-800">
                    <span className="text-xs font-bold tracking-wider text-brand-600 uppercase dark:text-brand-400">
                      Módulo: {modulo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleModule(items)}
                      className="text-[11px] font-semibold text-gray-500 hover:text-brand-500 underline"
                    >
                      {isAllModuleSelected ? "Desmarcar todos" : "Marcar todos"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {items.map((permiso) => {
                      const isChecked = selectedIds.includes(permiso.id);
                      return (
                        <div
                          key={permiso.id}
                          onClick={() => handleTogglePermission(permiso.id)}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition-colors ${
                            isChecked
                              ? "border-brand-500 bg-brand-50/30 dark:border-brand-400 dark:bg-brand-500/10"
                              : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800/50"
                          }`}
                        >
                          <Checkbox
                            id={`perm-${permiso.id}`}
                            checked={isChecked}
                            onChange={() => handleTogglePermission(permiso.id)}
                          />
                          <div>
                            <span className="block text-xs font-bold text-gray-800 dark:text-white">
                              {permiso.nombre}
                            </span>
                            <span className="block text-[10px] text-gray-400">
                              {permiso.codigo}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex w-full items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <span className="text-xs text-gray-500">
            {selectedIds.length} permiso(s) seleccionado(s)
          </span>

          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button size="sm" type="submit" disabled={isSaving || isLoading}>
              {isSaving ? "Guardando..." : "Guardar Permisos"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}