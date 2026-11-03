import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { VentasView } from "@/modules/ventas";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

/**
 * Ventas y comprobantes electrónicos en una sola pantalla. Basta tener uno de los
 * dos permisos: la vista muestra solo las pestañas a las que el usuario llega.
 */
export default function VentasPage() {
  return (
    <RoleGuard
      requiredPermission={[
        PermisoBanderas.VENTAS_LISTAR,
        PermisoBanderas.SUNAT_LISTAR,
      ]}
    >
      <VentasView />
    </RoleGuard>
  );
}
