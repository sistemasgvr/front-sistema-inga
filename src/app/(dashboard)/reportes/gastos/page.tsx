import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ReporteGastosView } from "@/modules/reportes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ReporteGastosPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.REPORTES_GASTOS}>
      <ReporteGastosView />
    </RoleGuard>
  );
}
