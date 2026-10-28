import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { SunatView } from "@/modules/sunat";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ComprobantesSunatPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.SUNAT_LISTAR}>
      <SunatView />
    </RoleGuard>
  );
}
