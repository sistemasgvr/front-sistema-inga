import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { CuentasPorCobrarView } from "@/modules/cuentas-por-cobrar";

/** Crédito del consorcio: saldos por cliente, consumos, abonos y el corte quincenal. */
export default function CuentasPorCobrarPage() {
  return (
    <RoleGuard requiredPermission="cxc.listar">
      <CuentasPorCobrarView />
    </RoleGuard>
  );
}
