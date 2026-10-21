import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { EstacionesView } from "@/modules/estaciones";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function EstacionesPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.ESTACIONES_LISTAR}>
      <EstacionesView />
    </RoleGuard>
  );
}
