import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ConveniosView } from "@/modules/convenios";

/**
 * La cuelgo de /personas/convenios y no de una ruta suelta porque un convenio
 * solo tiene sentido junto a las personas que lo usan. Así el menú agrupa las
 * dos pantallas del mismo maestro.
 */
export default function ConveniosPage() {
  return (
    <RoleGuard requiredPermission="convenios.listar">
      <ConveniosView />
    </RoleGuard>
  );
}
