import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

type SinPermisoProps = {
  /** Título del breadcrumb; si no se indica, no se muestra. */
  pageTitle?: string;
};

/**
 * Pantalla para quien entra a una ruta sin el permiso necesario.
 * No muestra códigos técnicos de permisos: el usuario no los entiende.
 */
export default function SinPermiso({ pageTitle }: SinPermisoProps) {
  return (
    <div>
      {pageTitle && <PageBreadcrumb pageTitle={pageTitle} />}
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="mb-4 rounded-2xl bg-error-50 p-4 text-error-600 dark:bg-error-500/10 dark:text-error-400">
          <Icon name="mdi:shield-lock-outline" size={48} />
        </div>
        <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          No tienes permiso para ver esta pantalla
        </h3>
        <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
          Si necesitas acceder, pide a un administrador que te asigne el permiso.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          <Icon name="mdi:home-outline" size={18} />
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
