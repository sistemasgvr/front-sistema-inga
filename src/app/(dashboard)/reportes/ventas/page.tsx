import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ReporteVentasView } from "@/modules/reportes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ReporteVentasPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.REPORTES_VENTAS}>
      <ReporteVentasView />
    </RoleGuard>
  );
}
