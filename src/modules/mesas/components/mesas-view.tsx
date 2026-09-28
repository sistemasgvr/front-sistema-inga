"use client";
import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { useMesas } from "../hooks/use-mesas";
import { MesaCard } from "./mesa-card";
import { PedidoPanel } from "./pedido-panel";
import { AbrirPedidoModal } from "./abrir-pedido-modal";
import { AgregarItemModal } from "./agregar-item-modal";
import { NuevoPedidoExternoModal } from "./nuevo-pedido-externo-modal";
import { PedidosExternosTable } from "./pedidos-externos-table";
import type { AbrirPedidoValues, Mesa } from "../types/mesas.types";

export function MesasView() {
  const m = useMesas();
  const [salonId, setSalonId] = useState<number>(0);
  const [showAbrirPedido, setShowAbrirPedido] = useState(false);
  const [showAgregarItem, setShowAgregarItem] = useState(false);
  const [showNuevoExterno, setShowNuevoExterno] = useState(false);
  // Modal con la carta y el resumen, justo después de abrir un delivery / para llevar.
  const [showEditorExterno, setShowEditorExterno] = useState(false);

  const activeSalones = m.salones.filter((s) => s.estado === 1);
  const selectedSalon =
    activeSalones.find((s) => Number(s.id) === salonId) ?? activeSalones[0];

  const mesasDelSalon = m.mesas.filter(
    (mesa) =>
      Number(mesa.id_salon) === Number(selectedSalon?.id) && mesa.estado === 1,
  );

  const handleSelectMesa = (mesa: Mesa) => {
    m.selectMesa(mesa);

    if (mesa.estado_mesa === 1) {
      void m.loadTurnoActivo();
      setShowAbrirPedido(true);
    } else if (mesa.id_pedido_activo) {
      void m.loadPedido(Number(mesa.id_pedido_activo));
    } else {
      m.error(new Error(`La mesa ${mesa.codigo} está ocupada pero no tiene un pedido en curso.`));
    }
  };

  // Un delivery / para llevar recién abierto sin productos guardados se descarta si no se continúa.
  const pedidoSinProductos =
    !!m.pedido &&
    m.pedido.estado_pedido === 1 &&
    !m.pedido.items.some((item) => item.tipo_linea !== 3);
  const editorSinProductos = showEditorExterno && pedidoSinProductos;

  useEffect(() => {
    if (!editorSinProductos) return;
    // Recargar o cerrar la pestaña dejaría el pedido vacío abierto: se pide confirmación.
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [editorSinProductos]);

  const cerrarEditorExterno = async () => {
    if (pedidoSinProductos && !(await m.descartar())) return;
    setShowEditorExterno(false);
    m.clearError();
  };

  const abrirPedidoExterno = async (values: AbrirPedidoValues) => {
    const ok = await m.abrirPedido(values);
    if (ok) {
      setShowNuevoExterno(false);
      setShowEditorExterno(true);
    }
    return ok;
  };

  const handleGenerarComprobante = async (tipo: string, documento: string) => {
    if (!m.pedido) return;
    try {
      // TODO: Implementar llamada al backend para generar comprobante
      console.log("Generando comprobante:", {
        tipo,
        documento,
        pedido: m.pedido.id,
      });
      m.error(
        new Error(
          "Función de generación de comprobante aún no implementada en el backend",
        ),
      );
    } catch (e) {
      m.error(e);
    }
  };

  const salonOptions = activeSalones.map((s) => ({
    value: String(s.id),
    label: s.nombre,
  }));

  return (
    <div>
      <PageBreadcrumb pageTitle="Mesas" />

      {m.feedback && (
        <div className="mb-5">
          <Alert {...m.feedback} />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Label>Sucursal</Label>
            <Select
              options={m.sucursales.map((s) => ({
                value: String(s.id),
                label: s.nombre,
              }))}
              defaultValue={String(m.sucursalId || "")}
              disabled={m.loading || m.saving}
              onChange={(v) => {
                setSalonId(0);
                m.changeSucursal(Number(v));
              }}
            />
          </div>
          <div className="w-56">
            <Label>Salón</Label>
            <Select
              options={salonOptions}
              defaultValue={String(selectedSalon?.id || "")}
              disabled={m.loading || m.saving || !m.sucursalId}
              onChange={(v) => {
                const id = Number(v);
                setSalonId(id);
                setShowAbrirPedido(false);
                setShowAgregarItem(false);
                void m.loadMesasPorSalon(id);
              }}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={m.loading || m.saving}
            onClick={() => void m.reload()}
            startIcon={<Icon name="mdi:refresh" size={18} />}
          >
            Actualizar
          </Button>
          <Button
            size="sm"
            disabled={m.loading || m.saving || !m.sucursalId}
            onClick={() => {
              m.selectMesa(null);
              void m.loadTurnoActivo();
              setShowNuevoExterno(true);
            }}
            startIcon={<Icon name="mdi:moped-outline" size={18} />}
          >
            Nuevo delivery / para llevar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {selectedSalon?.nombre || "Seleccione un salón"}
              </h3>
              <span className="text-sm text-gray-500">
                {m.loadingMesas
                  ? "Actualizando..."
                  : `${mesasDelSalon.length} mesas`}
              </span>
            </div>

            {m.loading || m.loadingMesas ? (
              <div
                className="rounded-2xl border border-gray-200 p-20 text-center text-gray-500 dark:border-gray-800"
                role="status"
              >
                Cargando mesas...
              </div>
            ) : mesasDelSalon.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 p-20 text-center text-gray-500 dark:border-gray-800">
                No hay mesas en este salón
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {mesasDelSalon.map((mesa) => (
                  <MesaCard
                    key={mesa.id}
                    mesa={mesa}
                    isSelected={m.selectedMesa?.id === mesa.id}
                    onClick={() => handleSelectMesa(mesa)}
                    disabled={m.saving}
                  />
                ))}
              </div>
            )}
          </div>

          <PedidosExternosTable
            pedidos={m.pedidosExternos}
            loading={m.loadingExternos}
            selectedId={m.selectedMesa ? null : (m.pedido?.id ?? null)}
            disabled={m.saving}
            onSelect={(p) => {
              m.selectMesa(null);
              void m.loadPedido(p.id);
            }}
          />
        </div>

        <div className="lg:col-span-1">
          <PedidoPanel
            key={m.pedido?.id ?? "sin-pedido"}
            pedido={m.pedido}
            loading={m.loading || m.loadingPedido}
            saving={m.saving}
            feedback={m.feedback}
            onComandar={() => void m.comandar()}
            onCambiarEstado={(estado) => void m.cambiarEstado(estado)}
            onAnular={() => void m.anular()}
            onAgregarItem={() => {
              m.clearError();
              setShowAgregarItem(true);
            }}
            onGenerarComprobante={handleGenerarComprobante}
          />
        </div>
      </div>

      {m.selectedMesa && (
        <AbrirPedidoModal
          isOpen={showAbrirPedido}
          mesa={m.selectedMesa}
          turnoActivo={m.turnoActivo}
          isSaving={m.saving}
          error={
            m.feedback?.variant === "error" ? m.feedback.message : undefined
          }
          onClose={() => {
            setShowAbrirPedido(false);
            m.clearError();
          }}
          onSubmit={m.abrirPedido}
        />
      )}

      <AgregarItemModal
        key={m.pedido?.id ?? "consulta-carta"}
        isOpen={showAgregarItem}
        canAdd={!!m.pedido && [1, 2].includes(m.pedido.estado_pedido)}
        isSaving={m.saving}
        error={m.feedback?.variant === "error" ? m.feedback.message : undefined}
        onClose={() => {
          setShowAgregarItem(false);
          m.clearError();
        }}
        onSubmit={m.agregarItems}
      />

      <NuevoPedidoExternoModal
        isOpen={showNuevoExterno}
        idSucursal={m.sucursalId}
        turnoActivo={m.turnoActivo}
        isSaving={m.saving}
        error={m.feedback?.variant === "error" ? m.feedback.message : undefined}
        onClose={() => {
          setShowNuevoExterno(false);
          m.clearError();
        }}
        onSubmit={abrirPedidoExterno}
      />

      {m.pedido && (
        <AgregarItemModal
          key={`editor-${m.pedido.id}`}
          isOpen={showEditorExterno}
          title={`Pedido ${m.pedido.codigo}: añadir platos`}
          canAdd={[1, 2].includes(m.pedido.estado_pedido)}
          isSaving={m.saving}
          error={m.feedback?.variant === "error" ? m.feedback.message : undefined}
          closeOnSave={false}
          closeConfirmMessage={
            pedidoSinProductos
              ? `El pedido ${m.pedido.codigo} no tiene productos guardados. Si sales, se cancelará. ¿Deseas salir?`
              : undefined
          }
          onClose={() => void cerrarEditorExterno()}
          onSubmit={m.agregarItems}
          sidePanel={
            <PedidoPanel
              pedido={m.pedido}
              loading={m.loadingPedido}
              saving={m.saving}
              feedback={null}
              hideAgregar
              onComandar={() => void m.comandar()}
              onCambiarEstado={(estado) => void m.cambiarEstado(estado)}
              onAnular={() => {
                void m.anular().then((ok) => {
                  if (ok) setShowEditorExterno(false);
                });
              }}
              onAgregarItem={() => undefined}
              onGenerarComprobante={handleGenerarComprobante}
            />
          }
        />
      )}
    </div>
  );
}
