import { Suspense } from "react";
import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { SubCategoriasView } from "@/modules/productos/subcategorias";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function SubCategoriasPage() {
  return (
    <RoleGuard requiredPermission={[PermisoBanderas.CATEGORIAS_LISTAR, PermisoBanderas.SUBCATEGORIAS_LISTAR]}>
      <Suspense fallback={<div className="p-6 text-center text-sm text-gray-500">Cargando subcategorías...</div>}>
        <SubCategoriasView />
      </Suspense>
    </RoleGuard>
  );
}
