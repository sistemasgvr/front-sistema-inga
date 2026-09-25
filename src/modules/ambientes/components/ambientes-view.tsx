"use client";
import { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { useAmbientes } from "../hooks/use-ambientes";
import {
  saveMesa,
  saveSalon,
  toggleEstado,
} from "../services/ambientes.service";
import { ESTADOS_MESA } from "../types/ambientes.types";
import type { Mesa, Salon } from "../types/ambientes.types";
import { PlanoSalones } from "./plano-salones";
import { MesaFormModal, SalonFormModal } from "./ambiente-form-modal";

export function AmbientesView() {
  const a = useAmbientes();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [salonForm, setSalonForm] = useState<{ salon?: Salon } | null>(null);
  const [mesaForm, setMesaForm] = useState<{
    mesa?: Mesa;
    salon: Salon;
  } | null>(null);
  const [confirm, setConfirm] = useState<{
    tipo: "salones" | "mesas";
    id: number;
    estado: number;
    nombre: string;
  } | null>(null);
  const activeSalones = a.salones.filter((s) => s.estado === 1);
  const visibleSalones = a.salones.filter(
    (s) => showInactive || s.estado === 1,
  );
  const selected =
    visibleSalones.find((s) => Number(s.id) === selectedId) ??
    visibleSalones[0];
  const activeMesas = a.mesas.filter((m) => m.estado === 1);
  const selectedMesas = a.mesas.filter(
    (m) =>
      Number(m.id_salon) === Number(selected?.id) &&
      (showInactive || m.estado === 1),
  );
  const formError =
    a.feedback?.variant === "error" ? a.feedback.message : undefined;
  const busy = a.loading || a.saving;
  const actionClass =
    "rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-600 disabled:opacity-40 dark:hover:bg-gray-800";
  return (
    <div>
      <PageBreadcrumb pageTitle="Ambientes" />
      {a.feedback && (
        <div className="mb-5">
          <Alert {...a.feedback} />
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Salones y mesas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Organiza los espacios de tu restaurante y consulta su
            disponibilidad.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Label>Sucursal</Label>
            <Select
              options={a.sucursales.map((s) => ({
                value: String(s.id),
                label: s.nombre,
              }))}
              defaultValue={String(a.sucursalId || "")}
              disabled={busy}
              onChange={(v) => {
                setSelectedId(null);
                a.changeSucursal(Number(v));
              }}
            />
          </div>
          {a.canManage && (
            <Button
              size="sm"
              disabled={busy || !a.sucursalId}
              onClick={() => setSalonForm({})}
              startIcon={<Icon name="mdi:plus" size={18} />}
            >
              Nuevo salón
            </Button>
          )}
        </div>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Object.entries(ESTADOS_MESA).map(([state, status]) => (
          <div
            key={state}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <span className={`rounded-xl border p-2.5 ${status.className}`}>
              <Icon name={status.icon} size={24} />
            </span>
            <div>
              <p className="text-xs text-gray-500">{status.label}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {
                  activeMesas.filter((m) => m.estado_mesa === Number(state))
                    .length
                }
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {editingPlan
            ? "Arrastra la cabecera o redimensiona desde los bordes. Cada cambio se guarda al soltar."
            : "Selecciona un salón en el plano para gestionar sus mesas."}
        </p>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="text-xs text-gray-500">
            {a.saving ? "Guardando..." : ""}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !a.sucursalId}
            onClick={() => void a.reload()}
            startIcon={<Icon name="mdi:refresh" size={18} />}
          >
            Actualizar
          </Button>
          {a.canManage && (
            <Button
              size="sm"
              variant={editingPlan ? "primary" : "outline"}
              disabled={busy}
              onClick={() => setEditingPlan((v) => !v)}
              startIcon={<Icon name="mdi:cursor-move" size={18} />}
            >
              {editingPlan ? "Finalizar edición" : "Editar plano"}
            </Button>
          )}
        </div>
      </div>
      {a.loading ? (
        <div
          className="rounded-2xl border border-gray-200 p-20 text-center text-gray-500 dark:border-gray-800"
          role="status"
        >
          Cargando ambientes...
        </div>
      ) : (
        <PlanoSalones
          salones={activeSalones}
          mesas={a.mesas}
          selectedId={Number(selected?.id) || null}
          editable={editingPlan && a.canManage}
          disabled={busy}
          onSelect={setSelectedId}
          onMove={(id, g) => void a.moveSalon(id, g)}
        />
      )}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Administrar ambientes
          </h3>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="accent-brand-500"
            />
            Mostrar inactivos
          </label>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {visibleSalones.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(Number(s.id))}
              className={`rounded-lg border px-3 py-2 text-sm ${Number(selected?.id) === Number(s.id) ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400" : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"}`}
            >
              {s.nombre}
              {s.estado === 0 ? " · Inactivo" : ""}
            </button>
          ))}
        </div>
        {selected ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selected.nombre}
                </h4>
                <p className="text-xs text-gray-500">
                  {selected.codigo} · {selectedMesas.length} mesas ·{" "}
                  {selectedMesas
                    .filter((m) => m.estado === 1)
                    .reduce((sum, m) => sum + m.capacidad_personas, 0)}{" "}
                  personas
                </p>
              </div>
              {a.canManage && (
                <div className="flex gap-2">
                  {selected.estado === 1 && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setSalonForm({ salon: selected })}
                      >
                        Editar salón
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => setMesaForm({ salon: selected })}
                      >
                        Nueva mesa
                      </Button>
                    </>
                  )}
                  <button
                    type="button"
                    className={actionClass}
                    disabled={busy}
                    aria-label={
                      selected.estado === 1
                        ? "Desactivar salón"
                        : "Activar salón"
                    }
                    onClick={() =>
                      setConfirm({
                        tipo: "salones",
                        id: Number(selected.id),
                        estado: selected.estado,
                        nombre: selected.nombre,
                      })
                    }
                  >
                    <Icon
                      name={
                        selected.estado === 1
                          ? "mdi:archive-outline"
                          : "mdi:restore"
                      }
                      size={22}
                    />
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-sm">
                <TableHeader className="border-y border-gray-100 text-xs text-gray-500 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-3 py-3">
                      Mesa
                    </TableCell>
                    <TableCell isHeader className="px-3 py-3">
                      Capacidad
                    </TableCell>
                    <TableCell isHeader className="px-3 py-3">
                      Estado
                    </TableCell>
                    <TableCell isHeader className="px-3 py-3 text-right">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMesas.map((m) => (
                    <TableRow
                      key={m.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <TableCell className="px-3 py-3 font-medium text-gray-800 dark:text-white">
                        {m.codigo}
                        {m.estado === 0 && (
                          <span className="ml-2 text-xs text-gray-400">
                            Inactiva
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-gray-500">
                        {m.capacidad_personas} personas
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs ${ESTADOS_MESA[m.estado_mesa].className}`}
                        >
                          {ESTADOS_MESA[m.estado_mesa].label}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        {a.canManage && (
                          <>
                            {m.estado === 1 && (
                              <button
                                type="button"
                                className={actionClass}
                                disabled={
                                  busy ||
                                  m.estado_mesa === 2 ||
                                  m.estado_mesa === 3
                                }
                                aria-label={`Editar mesa ${m.codigo}`}
                                onClick={() =>
                                  setMesaForm({ mesa: m, salon: selected })
                                }
                              >
                                <Icon name="mdi:pencil-outline" size={18} />
                              </button>
                            )}
                            <button
                              type="button"
                              className={actionClass}
                              disabled={
                                busy ||
                                m.estado_mesa === 2 ||
                                m.estado_mesa === 3
                              }
                              aria-label={`${m.estado === 1 ? "Desactivar" : "Activar"} mesa ${m.codigo}`}
                              onClick={() =>
                                setConfirm({
                                  tipo: "mesas",
                                  id: Number(m.id),
                                  estado: m.estado,
                                  nombre: m.codigo,
                                })
                              }
                            >
                              <Icon
                                name={
                                  m.estado === 1
                                    ? "mdi:archive-outline"
                                    : "mdi:restore"
                                }
                                size={18}
                              />
                            </button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!selectedMesas.length && (
              <p className="py-8 text-center text-sm text-gray-400">
                Este salón no tiene mesas en la vista actual.
              </p>
            )}
          </>
        ) : (
          <p className="py-5 text-sm text-gray-500">
            No hay salones para mostrar.
          </p>
        )}
      </div>
      {salonForm && (
        <SalonFormModal
          salon={salonForm.salon}
          sucursalId={a.sucursalId}
          isSaving={a.saving}
          error={formError}
          onClose={() => {
            if (!a.saving) setSalonForm(null);
          }}
          onSubmit={async (values) => {
            if (await a.mutate(() => saveSalon(values, salonForm.salon?.id)))
              setSalonForm(null);
          }}
        />
      )}
      {mesaForm && (
        <MesaFormModal
          mesa={mesaForm.mesa}
          salon={mesaForm.salon}
          isSaving={a.saving}
          error={formError}
          onClose={() => {
            if (!a.saving) setMesaForm(null);
          }}
          onSubmit={async (values) => {
            if (await a.mutate(() => saveMesa(values, mesaForm.mesa?.id)))
              setMesaForm(null);
          }}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onClose={() => {
          if (!a.saving) setConfirm(null);
        }}
        isLoading={a.saving}
        title={
          confirm?.estado === 1 ? "Desactivar ambiente" : "Reactivar ambiente"
        }
        description={`¿Deseas ${confirm?.estado === 1 ? "desactivar" : "reactivar"} «${confirm?.nombre ?? ""}»?`}
        confirmText={confirm?.estado === 1 ? "Desactivar" : "Reactivar"}
        variant={confirm?.estado === 1 ? "danger" : "info"}
        onConfirm={async () => {
          if (
            confirm &&
            (await a.mutate(() =>
              toggleEstado(confirm.tipo, confirm.id, confirm.estado),
            ))
          )
            setConfirm(null);
        }}
      />
    </div>
  );
}
