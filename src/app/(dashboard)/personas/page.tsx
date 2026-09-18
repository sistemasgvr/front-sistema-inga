import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { PersonasView } from "@/modules/personas";

/**
 * Protejo la ruta con el permiso 'personas.listar'.
 *
 * El backend ya bloquea los datos, pero sin esto un usuario sin permiso vería
 * la pantalla armada llenándose de errores. Prefiero que ni entre.
 */
export default function PersonasPage() {
  return (
    <RoleGuard requiredPermission="personas.listar">
      <PersonasView />
    </RoleGuard>
  );
}
