import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import  WorkingInProgress  from "@/components/common/WorkInProgress";

export default function SunatPage() {
  return (
    <RoleGuard requiredPermission="sunat.listar">
        <WorkingInProgress />
    </RoleGuard>
    );
}
