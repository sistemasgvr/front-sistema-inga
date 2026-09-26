import { MesasView } from "@/modules/mesas";
import { RoleGuard } from "@/modules/auth/guards/RoleGuard";

export default function MesasPage() {
  return (
    <RoleGuard requiredPermission="ambientes.listar">
      <MesasView />
    </RoleGuard>
  );
}
