"use client"

import { useSyncExternalStore } from "react";
import SinPermiso from "@/components/common/SinPermiso";
import { getStoredUser } from "../services/auth.service";

const sinSuscripcion = () => () => {};

export const RoleGuard = ({
  children,
  requiredPermission
}: {
  children: React.ReactNode;
  /** Con una lista basta tener cualquiera de los permisos. */
  requiredPermission: string | string[]
}) => {
  const requeridos = [requiredPermission].flat();
  // La sesión solo existe en el navegador: en el servidor queda en null y no se pinta nada.
  const hasAccess = useSyncExternalStore(
    sinSuscripcion,
    () => {
      const user = getStoredUser();
      const permisos = user?.permisos ?? [];
      const isSuper = Boolean(user?.es_super_admin || user?.sesion?.es_super_admin);
      return isSuper || requeridos.some((p) => permisos.includes(p));
    },
    () => null,
  );

  if (hasAccess === null) return null;
  // Antes redirigía al Dashboard sin explicar nada.
  if (!hasAccess) return <SinPermiso />;
  return <>{children}</>;
};
