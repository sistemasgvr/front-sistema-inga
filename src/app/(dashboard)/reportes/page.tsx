import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ReporteGeneralView } from "@/modules/reportes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ReportesPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.REPORTES_GENERAL}>
      <ReporteGeneralView />
    </RoleGuard>
  );
}
