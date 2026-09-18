import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { TurnosView } from "@/modules/caja";

/** Historial de turnos y sus descuadres, para el administrador. */
export default function TurnosPage() {
  return (
    <RoleGuard requiredPermission="turnos.listar">
      <TurnosView />
    </RoleGuard>
  );
}
