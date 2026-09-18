import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { CajasView } from "@/modules/caja";

/** Administración de las cajas físicas del local. */
export default function CajasPage() {
  return (
    <RoleGuard requiredPermission="cajas.listar">
      <CajasView />
    </RoleGuard>
  );
}
