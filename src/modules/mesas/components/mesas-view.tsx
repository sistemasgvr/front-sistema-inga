"use client";
import { useState, useEffect } from "react";
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
import type { Mesa, AbrirPedidoValues, AgregarItemValues } from "../types/mesas.types";
import * as api from "../services/mesas.service";

export function MesasView() {
  const m = useMesas();
  const [salonId, setSalonId] = useState<number>(0);
  const [showAbrirPedido, setShowAbrirPedido] = useState(false);
  const [showAgregarItem, setShowAgregarItem] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const activeSalones = m.salones.filter((s) => s.estado === 1);
  const selectedSalon =
    activeSalones.find((s) => Number(s.id) === salonId) ?? activeSalones[0];

  const mesasDelSalon = m.mesas.filter(
    (mesa) =>
      Number(mesa.id_salon) === Number(selectedSalon?.id) && mesa.estado === 1,
  );

  useEffect(() => {
    if (m.sucursalId) {
      void m.loadProductos();
      void m.loadMozos();
      void m.loadTurnoActivo();
    }
  }, [m.sucursalId]);

  useEffect(() => {
    if (selectedSalon?.id) {
      void m.loadMesasPorSalon(selectedSalon.id);
    }
  }, [selectedSalon?.id]);

  const handleSelectMesa = (mesa: Mesa) => {
    setFormError(undefined);
    m.selectMesa(mesa);

    if (mesa.estado_mesa === 1) {
      setShowAbrirPedido(true);
    }
  };

  const handleAbrirPedido = async (values: AbrirPedidoValues) => {
    try {
      const pedido = await api.abrirPedido(values);
      await m.loadPedido(pedido.id);
      if (selectedSalon?.id) {
        await m.loadMesasPorSalon(selectedSalon.id);
      }
      return true;
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al abrir pedido");
      return false;
    }
  };

  const handleAgregarItem = async (values: AgregarItemValues) => {
    if (!m.pedido) return false;
    try {
      await api.agregarItem(m.pedido.id, values);
      await m.loadPedido(m.pedido.id);
      return true;
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al agregar ítem");
      return false;
    }
  };

  const handleComandar = async () => {
    if (!m.pedido) return;
    try {
      await api.comandarPedido(m.pedido.id);
      await m.loadPedido(m.pedido.id);
      if (selectedSalon?.id) {
        await m.loadMesasPorSalon(selectedSalon.id);
      }
    } catch (e) {
      m.error(e);
    }
  };

  const handleCambiarEstado = async (estado: number) => {
    if (!m.pedido) return;
    try {
      await api.cambiarEstadoPedido(m.pedido.id, { estado_pedido: estado });
      await m.loadPedido(m.pedido.id);
      if (selectedSalon?.id) {
        await m.loadMesasPorSalon(selectedSalon.id);
      }
    } catch (e) {
      m.error(e);
    }
  };

  const handleAnular = async () => {
    if (!m.pedido) return;
    const raw =
      localStorage.getItem("auth") ?? sessionStorage.getItem("auth") ?? "{}";
    const user = JSON.parse(raw);
    try {
      await api.anularPedido(m.pedido.id, {
        id_usuario_autoriza: user?.user?.id || 0,
        motivo: "Anulado desde el panel de mesas",
      });
      m.clearPedido();
      if (selectedSalon?.id) {
        await m.loadMesasPorSalon(selectedSalon.id);
      }
    } catch (e) {
      m.error(e);
    }
  };

  const handleGenerarComprobante = async (tipo: string, documento: string) => {
    if (!m.pedido) return;
    try {
      // TODO: Implementar llamada al backend para generar comprobante
      console.log("Generando comprobante:", { tipo, documento, pedido: m.pedido.id });
      m.error(new Error("Función de generación de comprobante aún no implementada en el backend"));
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
              disabled={m.loading}
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
              disabled={m.loading || !m.sucursalId}
              onChange={(v) => setSalonId(Number(v))}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={m.loading}
            onClick={() => void m.reload()}
            startIcon={<Icon name="mdi:refresh" size={18} />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {selectedSalon?.nombre || "Seleccione un salón"}
              </h3>
              <span className="text-sm text-gray-500">
                {mesasDelSalon.length} mesas
              </span>
            </div>

            {m.loading ? (
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
        </div>

        <div className="lg:col-span-1">
          <PedidoPanel
            pedido={m.pedido}
            loading={m.loading}
            saving={m.saving}
            feedback={m.feedback}
            onComandar={handleComandar}
            onCambiarEstado={handleCambiarEstado}
            onAnular={handleAnular}
            onCerrar={() => {
              m.clearPedido();
              m.selectMesa(null);
            }}
            onAgregarItem={() => setShowAgregarItem(true)}
            onGenerarComprobante={handleGenerarComprobante}
            comprobanteOptions={m.listaComprobanteTipo.selectOptions}
          />
        </div>
      </div>

      {m.selectedMesa && (
        <AbrirPedidoModal
          isOpen={showAbrirPedido}
          mesa={m.selectedMesa}
          mozos={m.mozos}
          turnoActivo={m.turnoActivo}
          isSaving={m.saving}
          error={formError}
          onClose={() => {
            setShowAbrirPedido(false);
            setFormError(undefined);
          }}
          onSubmit={handleAbrirPedido}
        />
      )}

      <AgregarItemModal
        isOpen={showAgregarItem}
        productos={m.productos}
        isSaving={m.saving}
        error={formError}
        onClose={() => {
          setShowAgregarItem(false);
          setFormError(undefined);
        }}
        onSubmit={handleAgregarItem}
      />
    </div>
  );
}
