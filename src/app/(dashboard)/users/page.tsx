import { UsersView } from "@/modules/users";
import { RoleGuard } from "@/modules/auth/guards/RoleGuard";

export default function UsersPage() {
  return (
    <RoleGuard requiredPermission="usuarios.listar">
      <UsersView />
    </RoleGuard>
  );
}