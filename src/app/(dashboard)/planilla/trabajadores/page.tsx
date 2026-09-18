import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { TrabajadoresView } from "@/modules/planilla";

/**
 * Mantenimiento del personal en planilla.
 *
 * Pido 'trabajadores.listar' y no un permiso de planilla general: alguien puede
 * necesitar administrar el personal sin ver los montos que se les paga.
 */
export default function TrabajadoresPage() {
  return (
    <RoleGuard requiredPermission="trabajadores.listar">
      <TrabajadoresView />
    </RoleGuard>
  );
}
