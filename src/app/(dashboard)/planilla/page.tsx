import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { PagosPlanillaView } from "@/modules/planilla";

/**
 * Pantalla principal del módulo: los pagos de la quincena.
 *
 * La pongo en la raíz de /planilla y no en /planilla/pagos porque es lo que se
 * usa a diario; el mantenimiento de trabajadores es esporádico.
 */
export default function PagosPlanillaPage() {
  return (
    <RoleGuard requiredPermission="planilla.pagos.listar">
      <PagosPlanillaView />
    </RoleGuard>
  );
}
