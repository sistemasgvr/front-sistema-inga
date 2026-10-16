import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ReporteCuentasView } from "@/modules/reportes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ReporteCuentasPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.REPORTES_CUENTAS}>
      <ReporteCuentasView />
    </RoleGuard>
  );
}
