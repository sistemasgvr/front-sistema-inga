import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { AlmacenesView } from "@/modules/almacenes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function AlmacenesPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.ALMACENES_LISTAR}>
      <AlmacenesView />
    </RoleGuard>
  );
}
