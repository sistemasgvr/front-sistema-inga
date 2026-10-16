import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ReporteCajaView } from "@/modules/reportes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ReporteCajaPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.REPORTES_CAJA}>
      <ReporteCajaView />
    </RoleGuard>
  );
}
