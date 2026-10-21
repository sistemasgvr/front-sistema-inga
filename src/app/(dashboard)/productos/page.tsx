import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ProductosView } from "@/modules/productos";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export default function ProductosPage() {
  return (
    <RoleGuard requiredPermission={PermisoBanderas.PRODUCTOS_LISTAR}>
      <ProductosView />
    </RoleGuard>
  );
}
