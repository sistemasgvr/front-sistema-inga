import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { InventarioView } from "@/modules/inventario/components/inventario-view";

export default function StockPage() {
  return (
    <RoleGuard requiredPermission="inventario.ver">
        <InventarioView />
    </RoleGuard>
    );
}

