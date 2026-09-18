import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { GastosDiariosView } from "@/modules/gastos-diarios";

/**
 * Compras del día para la cocina.
 *
 * La cuelgo de /gastos junto a los administrativos: los dos son egresos y el
 * usuario los piensa juntos, aunque su lógica sea distinta.
 */
export default function GastosDiariosPage() {
  return (
    <RoleGuard requiredPermission="gdo.listar">
      <GastosDiariosView />
    </RoleGuard>
  );
}
