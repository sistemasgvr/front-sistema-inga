import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { RolesView } from "@/modules/roles";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function RolesPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.ROLES_LISTAR}>
      <RolesView />
    </RoleGuard>
  );
}
