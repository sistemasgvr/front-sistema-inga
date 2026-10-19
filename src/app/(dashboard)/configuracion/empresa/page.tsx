import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { EmpresaView } from "@/modules/empresa";

export default function EmpresaPage() {
  return (
    <RoleGuard requiredPermission="empresa.ver">
      <EmpresaView />
    </RoleGuard>
  );
}
