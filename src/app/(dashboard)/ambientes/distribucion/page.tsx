import { AmbientesView } from "@/modules/ambientes";
import { RoleGuard } from "@/modules/auth/guards/RoleGuard";

export default function AmbientesPage() {
  return (
    <RoleGuard requiredPermission="ambientes.listar">
      <AmbientesView />
    </RoleGuard>
  );
}
