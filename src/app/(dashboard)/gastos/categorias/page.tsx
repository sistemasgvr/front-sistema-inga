import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { CategoriasGastoView } from "@/modules/gastos-administrativos";

/**
 * Configuración de categorías de gasto.
 *
 * Pido 'gastos.categorias.listar' y no el de gestionar: alguien puede necesitar
 * consultar cómo está clasificado sin poder modificar la estructura.
 */
export default function CategoriasGastoPage() {
  return (
    <RoleGuard requiredPermission="gastos.categorias.listar">
      <CategoriasGastoView />
    </RoleGuard>
  );
}
