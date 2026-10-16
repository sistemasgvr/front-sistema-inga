import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ReporteInventarioView } from "@/modules/reportes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ReporteInventarioPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.REPORTES_INVENTARIO}>
      <ReporteInventarioView />
    </RoleGuard>
  );
}
