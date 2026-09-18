"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { useCategoriasGasto } from "../hooks/use-categorias-gasto";
import { TIPO_GASTO, type CategoriaGasto } from "../types/gastos.types";
import { CategoriaFormModal } from "./categoria-form-modal";

export function CategoriasGastoView() {
  const {
    registros,
    resumen,
    estadoFiltro,
    setEstadoFiltro,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    editing,
    padreParaNueva,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    save,
    confirmItem,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useCategoriasGasto();

  const isDesactivar = confirmItem?.estado === 1;

  /**
   * Una fila del árbol. La reutilizo para raíces y subcategorías cambiando
   * `esHija`, que solo ajusta la sangría y el tamaño.
   */
  function FilaCategoria({
    cat,
    esHija = false,
  }: {
    cat: CategoriaGasto;
    esHija?: boolean;
  }) {
    const activo = cat.estado === 1;
    const conGastos = Number(cat.gastos_registrados) > 0;
    const conHijas = (cat.subcategorias?.length ?? 0) > 0;
    // Espejo de la regla del backend: no se da de baja con gastos o hijas.
    const bloqueaBaja = activo && (conGastos || conHijas);

    return (
      <div
        className={`flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3.5 transition-colors last:border-0 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30 ${
          esHija ? "pl-14" : ""
        }`}
      >
        <Icon
          name={esHija ? "mdi:subdirectory-arrow-right" : "mdi:folder-outline"}
          size={esHija ? 16 : 19}
          className="shrink-0 text-gray-400"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-semibold text-gray-900 dark:text-white ${
                esHija ? "text-sm" : "text-sm"
              }`}
            >
              {cat.nombre}
            </span>
            <span className="font-mono text-xs text-gray-400">{cat.codigo}</span>
            {!esHija && (
              <Badge
                size="sm"
                color={cat.tipo_gasto === TIPO_GASTO.FIJO ? "info" : "warning"}
              >
                {cat.tipo_gasto_nombre}
              </Badge>
            )}
            {!activo && (
              <Badge size="sm" color="error">
                De baja
              </Badge>
            )}
          </div>
          {conGastos && (
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              {cat.gastos_registrados} gasto(s) registrado(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {!esHija && activo && (
            <button
              type="button"
              onClick={() => openCreateModal(cat)}
              className="text-gray-500 transition-colors hover:text-brand-600"
              title={`Agregar subcategoría a ${cat.nombre}`}
            >
              <Icon name="mdi:playlist-plus" size={19} />
            </button>
          )}
          {activo && (
            <button
              type="button"
              onClick={() => openEditModal(cat)}
              className="text-gray-500 transition-colors hover:text-brand-600"
              title="Editar"
            >
              <Icon name="mdi:pencil-outline" size={19} />
            </button>
          )}
          <button
            type="button"
            onClick={() => openConfirmModal(cat)}
            disabled={bloqueaBaja}
            className={
              activo
                ? "text-gray-500 transition-colors hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-500"
                : "text-success-600 transition-colors hover:text-success-700"
            }
            title={
              bloqueaBaja
                ? conGastos
                  ? `No se puede dar de baja: tiene ${cat.gastos_registrados} gasto(s) registrado(s)`
                  : "No se puede dar de baja: tiene subcategorías activas"
                : activo
                  ? "Dar de baja"
                  : "Reactivar"
            }
          >
            <Icon
              name={activo ? "mdi:trash-can-outline" : "mdi:refresh"}
              size={19}
            />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Categorías de gasto" />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Icon
          name="mdi:information-outline"
          size={20}
          className="mt-0.5 shrink-0 text-brand-500"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Clasifican los gastos para el reporte mensual. Los{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">fijos</span>{" "}
          se repiten cada mes (alquiler, luz, internet); los{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            variables
          </span>{" "}
          son puntuales. Puedes anidar un nivel de subcategorías.
        </p>
      </div>

      {feedback && (
        <div className="mb-5">
          <Alert
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
          />
          <button
            type="button"
            onClick={clearFeedback}
            className="mt-2 text-xs text-gray-500 underline"
          >
            Cerrar aviso
          </button>
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          {
            etiqueta: "Fijas",
            valor: resumen.fijos,
            icono: "mdi:calendar-sync-outline",
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            etiqueta: "Variables",
            valor: resumen.variables,
            icono: "mdi:calendar-question-outline",
            color: "text-warning-600 dark:text-warning-400",
          },
          {
            etiqueta: "De baja",
            valor: resumen.inactivos,
            icono: "mdi:folder-off-outline",
            color: "text-error-500",
          },
        ].map((t) => (
          <div
            key={t.etiqueta}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-center gap-2">
              <Icon name={t.icono} size={16} className={t.color} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t.etiqueta}
              </span>
            </div>
            <p className={`mt-1.5 text-2xl font-bold ${t.color}`}>{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { valor: "activos", etiqueta: "Activas" },
              { valor: "inactivos", etiqueta: "De baja" },
              { valor: "todos", etiqueta: "Todas" },
            ] as const
          ).map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setEstadoFiltro(f.valor)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                estadoFiltro === f.valor
                  ? "bg-slate-700 text-white dark:bg-slate-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          type="button"
          onClick={() => openCreateModal()}
          startIcon={<Icon name="mdi:plus" size={18} />}
        >
          Nueva categoría
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {isLoading ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            Cargando categorías...
          </p>
        ) : registros.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Icon
              name="mdi:folder-outline"
              size={40}
              className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
            />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No hay categorías
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Crea la primera para poder clasificar los gastos.
            </p>
          </div>
        ) : (
          registros.map((cat) => (
            <div key={cat.id}>
              <FilaCategoria cat={cat} />
              {(cat.subcategorias ?? []).map((hija) => (
                <FilaCategoria key={hija.id} cat={hija} esHija />
              ))}
            </div>
          ))
        )}
      </div>

      <CategoriaFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={save}
        categoria={editing}
        padre={padreParaNueva}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Dar de baja la categoría?" : "¿Reactivar categoría?"}
        description={
          isDesactivar
            ? `'${confirmItem?.nombre}' dejará de estar disponible al registrar gastos. El histórico se conserva.`
            : `'${confirmItem?.nombre}' volverá a estar disponible al registrar gastos.`
        }
        confirmText={isDesactivar ? "Sí, dar de baja" : "Sí, reactivar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
