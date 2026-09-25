import { Suspense } from "react";
import { SubCategoriasView } from "@/modules/productos/subcategorias";

export default function SubCategoriasPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-gray-500">Cargando subcategorías...</div>}>
      <SubCategoriasView />
    </Suspense>
  );
}