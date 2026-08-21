"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getStoredUser } from "../services/auth.service";

export const RoleGuard = ({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requiredPermission: string 
}) => {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    const hasAccess = user?.es_super_admin || user?.permisos?.includes(requiredPermission);

    if (!hasAccess) {
      router.replace('/dashboard');
    }
  }, [requiredPermission, router]);

  return <>{children}</>;
};