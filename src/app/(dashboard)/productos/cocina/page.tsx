import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { CocinaView } from "@/modules/inventario";
export default function CocinaPage(){return <RoleGuard requiredPermission="produccion.preparar"><CocinaView/></RoleGuard>;}
