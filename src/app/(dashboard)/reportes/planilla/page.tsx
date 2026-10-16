import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ReportePlanillaView } from "@/modules/reportes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ReportePlanillaPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.REPORTES_PLANILLA}>
      <ReportePlanillaView />
    </RoleGuard>
  );
}
