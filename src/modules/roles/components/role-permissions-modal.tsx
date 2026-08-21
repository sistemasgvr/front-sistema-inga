"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
      setSearchTerm("");
    }
  }, [isOpen, initialSelectedIds]);

  const safeCatalog = Array.isArray(catalog) ? catalog : [];

  const filteredCatalog = safeCatalog.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    return (
      item.nombre.toLowerCase().includes(term) ||
      item.codigo.toLowerCase().includes(term) ||
      (item.modulo && item.modulo.toLowerCase().includes(term))
    );
  });

  const groupedPermissions = filteredCatalog.reduce<Record<string, PermisoItem[]>>(
    (acc, item) => {
      const mod = item.modulo || "General";
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(selectedIds);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[780px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <div className="mb-5 border-b border-gray-100 pb-4 dark:border-gray-800">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permisos del rol
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona los permisos asignados a <strong className="text-gray-800 dark:text-gray-200">{role?.nombre}</strong>.
          </p>
        </div>

        <div className="mb-5">
          <Input
            type="search"
            placeholder="Buscar permiso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-500">
            <Icon name="mdi:loading" size={32} className="animate-spin text-brand-500 mb-2" />
            <span>Cargando permisos del rol...</span>
          </div>
        ) : Object.keys(groupedPermissions).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 my-4 text-center dark:border-gray-800">
            <Icon name="mdi:shield-search" size={44} className="text-gray-400 mb-2" />
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
              No se encontraron permisos
            </p>
            <p className="text-sm text-gray-400 max-w-xs mt-1">
              {searchTerm
                ? "No hay resultados que coincidan con la búsqueda."
                : "No existen permisos configurados en el sistema."}
            </p>
          </div>
        ) : (
          <div className="custom-scrollbar max-h-[55vh] overflow-y-auto pr-3 space-y-5">
            {Object.entries(groupedPermissions).map(([modulo, items]) => (
              <div
                key={modulo}
                className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/40"
              >
                <h5 className="mb-4 text-sm font-bold tracking-wide text-gray-800 uppercase dark:text-gray-200">
                  {modulo}
                </h5>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {items.map((permiso) => {
                    const isChecked = selectedIds.includes(permiso.id);
                    return (
                      <div
                        key={permiso.id}
                        onClick={() => handleTogglePermission(permiso.id)}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${
                          isChecked
                            ? "bg-brand-50/50 dark:bg-brand-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                          <Checkbox
                            id={`perm-${permiso.id}`}
                            checked={isChecked}
                            onChange={() => handleTogglePermission(permiso.id)}
                          />
                        </div>
                        <div className="select-none">
                          <span className="block text-sm font-semibold text-gray-800 dark:text-white">
                            {permiso.nombre}
                          </span>
                          <span className="block text-xs text-gray-400 mt-0.5">
                            {permiso.codigo}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex w-full items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <span className="text-sm text-gray-500">
            <strong className="text-gray-800 dark:text-white">{selectedIds.length}</strong> permiso(s) seleccionado(s)
          </span>

          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cerrar
            </Button>
            <Button size="sm" type="submit" disabled={isSaving || isLoading}>
              {isSaving ? "Guardando..." : "Guardar permisos"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}