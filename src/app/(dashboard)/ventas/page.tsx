import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { VentasView } from "@/modules/ventas";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function VentasPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.VENTAS_LISTAR}>
      <VentasView />
    </RoleGuard>
  );
}
