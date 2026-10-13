"use client";
import { useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import { useErrorNotification } from "@/shared/hooks/use-error-notification";
import { createCategoria } from "../categorias/services/categorias.service";
import { createSubCategoria } from "../subcategorias/services/subcategorias.service";
import type { CategoriaFormValues } from "../categorias/types/categorias.types";
import type { SubCategoriaFormValues } from "../subcategorias/types/subcategorias.types";

export function useProductoClasificacion(onCategory: (id: number) => Promise<void>, onSubcategory: (id: number) => Promise<void>) {
  const [modal, setModal] = useState<"categoria" | "subcategoria" | null>(null);
  const [saving, setSaving] = useState(false);
  const notify = useErrorNotification("No se pudo guardar");
  const user = getStoredUser();
  const permissions = user?.permisos ?? [];
  const superuser = Boolean(user?.es_super_admin || user?.sesion?.es_super_admin);
  async function saveCategory(values: CategoriaFormValues) {
    if (saving) return;
    setSaving(true);
    try { const result = await createCategoria(values); await onCategory(result.id); setModal(null); }
    catch (error) { notify(error instanceof Error ? error.message : "No se pudo crear la categoría."); }
    finally { setSaving(false); }
  }
  async function saveSubcategory(values: SubCategoriaFormValues) {
    if (saving) return;
    setSaving(true);
    try { const result = await createSubCategoria(values); await onSubcategory(result.id); setModal(null); }
    catch (error) { notify(error instanceof Error ? error.message : "No se pudo crear la subcategoría."); }
    finally { setSaving(false); }
  }
  return { modal, setModal, saving, saveCategory, saveSubcategory,
    canCategory: superuser || permissions.includes(PermisoBanderas.CATEGORIAS_CREAR),
    canSubcategory: superuser || permissions.includes(PermisoBanderas.SUBCATEGORIAS_CREAR) };
}
