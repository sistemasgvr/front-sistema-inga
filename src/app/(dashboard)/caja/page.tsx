import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { MiTurnoView } from "@/modules/caja";

/**
 * Pantalla principal del cajero: abre su turno, registra movimientos y cierra.
 *
 * Pido 'turnos.ver' y no 'turnos.abrir' porque alguien puede tener permiso de
 * consultar su turno sin poder abrir uno nuevo. El permiso de abrir lo valida
 * el backend cuando pulsa el botón.
 */
export default function MiTurnoPage() {
  return (
    <RoleGuard requiredPermission="turnos.ver">
      <MiTurnoView />
    </RoleGuard>
  );
}
