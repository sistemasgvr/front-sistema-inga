import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { GastosView } from "@/modules/gastos-administrativos";

/**
 * Pantalla principal del módulo: los gastos del mes.
 *
 * Va en la raíz de /gastos porque es lo que se usa; las categorías son
 * configuración que se toca una vez.
 */
export default function GastosPage() {
  return (
    <RoleGuard requiredPermission="gastos.listar">
      <GastosView />
    </RoleGuard>
  );
}
