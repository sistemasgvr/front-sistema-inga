import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { CuentasPorPagarView } from "@/modules/cuentas-por-pagar";

/** Deudas con proveedores: saldos, compras a crédito y abonos semanales. */
export default function CuentasPorPagarPage() {
  return (
    <RoleGuard requiredPermission="cxp.listar">
      <CuentasPorPagarView />
    </RoleGuard>
  );
}
