"use client";
import { useState, type FormEvent } from "react";
import Label from "@/components/form/Label";
import InputField from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { LISTA_IDS, ListaSelect } from "@/modules/listas";
import { crearClienteRapido } from "@/modules/personas";
import { useBuscarClientes } from "../hooks/use-buscar-clientes";
import type { AbrirPedidoValues } from "../types/mesas.types";

// Pedidos sin mesa: solo para llevar (2) y delivery (3).
const CODIGOS_TIPO_EXTERNO = ["LLEVAR", "DELIVERY"];
const TIPO_DELIVERY = 3;

type ClienteElegido = {
  id: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
};

interface NuevoPedidoExternoModalProps {
  isOpen: boolean;
  idSucursal: number;
  turnoActivo: { id: number } | null;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  /** Abre el pedido; si todo va bien, la vista continúa con la carta y el resumen. */
  onSubmit: (values: AbrirPedidoValues) => Promise<boolean>;
}

export function NuevoPedidoExternoModal(props: NuevoPedidoExternoModalProps) {
  if (!props.isOpen) return null;
  return <NuevoPedidoExternoContent {...props} />;
}

function NuevoPedidoExternoContent({
  isOpen,
  idSucursal,
  turnoActivo,
  isSaving,
  error,
  onClose,
  onSubmit,
}: NuevoPedidoExternoModalProps) {
  // El responsable es el usuario de la sesión y no se puede cambiar.
  const [usuario] = useState(getStoredUser);
  const nombreUsuario = usuario
    ? [usuario.nombres, usuario.apellidos].filter(Boolean).join(" ")
    : "";
  const [tipoPedido, setTipoPedido] = useState("");

  // Cliente: se busca en cli_persona o se registra uno nuevo.
  const [modo, setModo] = useState<"buscar" | "nuevo">("buscar");
  const [busqueda, setBusqueda] = useState("");
  const [cliente, setCliente] = useState<ClienteElegido | null>(null);
  const [nombres, setNombres] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const buscador = useBuscarClientes(modo === "buscar" && !cliente ? busqueda : "");

  // Datos de contacto y entrega de este pedido.
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [creando, setCreando] = useState(false);
  const [errorCliente, setErrorCliente] = useState("");

  const esDelivery = Number(tipoPedido) === TIPO_DELIVERY;
  const dniValido = !dni.trim() || /^[0-9]{8}$/.test(dni.trim());
  const clienteListo =
    modo === "buscar" ? !!cliente : !!nombres.trim() && !!apellido.trim() && dniValido;
  const ocupado = isSaving || creando;
  const valido =
    !!usuario &&
    !!turnoActivo &&
    !!idSucursal &&
    !!tipoPedido &&
    clienteListo &&
    (!esDelivery || !!direccion.trim());

  const elegirCliente = (c: ClienteElegido, datos: { telefono: string | null; direccion: string | null }) => {
    setCliente(c);
    setErrorCliente("");
    setTelefono(datos.telefono ?? "");
    setDireccion(datos.direccion ?? "");
  };

  const cambiarModo = (nuevo: "buscar" | "nuevo") => {
    setModo(nuevo);
    setCliente(null);
    setErrorCliente("");
    if (nuevo === "nuevo" && !nombres) setNombres(busqueda.trim());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (ocupado || !valido || !usuario || !turnoActivo) return;

    let elegido = cliente;
    if (modo === "nuevo") {
      setCreando(true);
      setErrorCliente("");
      try {
        const persona = await crearClienteRapido({
          nombres,
          apellido_paterno: apellido,
          dni,
          telefono,
          direccion,
        });
        elegido = {
          id: persona.id,
          nombre: persona.nombre_completo ?? `${nombres} ${apellido}`.trim(),
          documento: persona.num_documento || null,
          telefono: persona.telefono,
        };
        // Queda seleccionado: si abrir el pedido falla, reintentar no duplica el cliente.
        setCliente(elegido);
        setModo("buscar");
      } catch (err) {
        setErrorCliente(err instanceof Error ? err.message : "No se pudo registrar el cliente.");
        return;
      } finally {
        setCreando(false);
      }
    }
    if (!elegido) return;

    // El cliente queda vinculado por id_persona; la observación guarda solo lo propio de
    // este pedido: un teléfono distinto al registrado, la dirección de entrega y las notas.
    const observacion = [
      telefono.trim() && telefono.trim() !== (elegido.telefono ?? "") && `Tel: ${telefono.trim()}`,
      esDelivery && `Dirección: ${direccion.trim()}`,
      observaciones.trim(),
    ]
      .filter(Boolean)
      .join(" | ");
    await onSubmit({
      tipo_pedido: Number(tipoPedido) as 2 | 3,
      id_sucursal: idSucursal,
      id_mozo: usuario.id,
      id_turno: turnoActivo.id,
      id_persona: elegido.id,
      num_comensales: 1,
      observacion: observacion || undefined,
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={() => {
        if (!ocupado) onClose();
      }}
      onSubmit={handleSubmit}
      title="Nuevo delivery / para llevar"
      subtitle="Completa los datos del pedido y continúa para añadir los platos"
      isSaving={ocupado}
      submitDisabled={!valido}
      submitText="Siguiente"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tipo de pedido</Label>
            <ListaSelect
              idLista={LISTA_IDS.PEDIDO_TIPO}
              campoEtiqueta="codigo"
              codigos={CODIGOS_TIPO_EXTERNO}
              disabled={ocupado}
              defaultValue={tipoPedido}
              onChange={setTipoPedido}
              placeholder="Seleccione un tipo"
            />
          </div>
          <div>
            <Label>Atendido por</Label>
            <InputField value={nombreUsuario} disabled placeholder="Sin sesión activa" />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Cliente</Label>
            <button type="button" disabled={ocupado} onClick={() => cambiarModo(modo === "buscar" ? "nuevo" : "buscar")}
              className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50">
              {modo === "buscar" ? "+ Nuevo cliente" : "Buscar cliente existente"}
            </button>
          </div>

          {modo === "buscar" && cliente && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-white">{cliente.nombre}</p>
                <p className="text-xs text-gray-500">
                  {[cliente.documento ? `DNI ${cliente.documento}` : "Sin documento", cliente.telefono && `Tel. ${cliente.telefono}`]
                    .filter(Boolean).join(" · ")}
                </p>
              </div>
              <button type="button" disabled={ocupado} onClick={() => setCliente(null)}
                className="shrink-0 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white">Cambiar</button>
            </div>
          )}

          {modo === "buscar" && !cliente && (
            <div>
              <InputField value={busqueda} disabled={ocupado} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o DNI (mínimo 2 caracteres)" />
              {buscador.activa && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {buscador.isLoading ? (
                    <p role="status" className="p-3 text-sm text-gray-500">Buscando...</p>
                  ) : buscador.error ? (
                    <p className="p-3 text-sm text-error-500">{buscador.error}</p>
                  ) : !buscador.clientes.length ? (
                    <p className="p-3 text-sm text-gray-500">
                      No se encontraron clientes.{" "}
                      <button type="button" className="font-medium text-brand-600 hover:underline" onClick={() => cambiarModo("nuevo")}>
                        Registrar nuevo
                      </button>
                    </p>
                  ) : (
                    buscador.clientes.map((c) => (
                      <button key={c.id} type="button"
                        className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                        onClick={() => elegirCliente(
                          { id: c.id, nombre: c.nombre_completo ?? "Sin nombre", documento: c.num_documento, telefono: c.telefono },
                          c,
                        )}>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{c.nombre_completo}</span>
                          <span className="block text-xs text-gray-500">
                            {[c.num_documento ? `${c.tipo_documento_nombre ?? "Doc."} ${c.num_documento}` : "Sin documento", c.telefono && `Tel. ${c.telefono}`]
                              .filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <Icon name="mdi:chevron-right" size={18} className="shrink-0 text-gray-400" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {modo === "nuevo" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="cliente-nombres">Nombres</Label>
                <InputField id="cliente-nombres" value={nombres} maxLength={100} disabled={ocupado}
                  onChange={(e) => setNombres(e.target.value)} placeholder="Nombres" />
              </div>
              <div>
                <Label htmlFor="cliente-apellido">Apellido</Label>
                <InputField id="cliente-apellido" value={apellido} maxLength={100} disabled={ocupado}
                  onChange={(e) => setApellido(e.target.value)} placeholder="Apellido paterno" />
              </div>
              <div>
                <Label htmlFor="cliente-dni">DNI (opcional)</Label>
                <InputField id="cliente-dni" value={dni} maxLength={8} disabled={ocupado}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))} placeholder="8 dígitos" error={!dniValido} />
                {!dniValido && <p className="mt-1 text-xs text-error-500">El DNI debe tener 8 dígitos.</p>}
              </div>
            </div>
          )}
          {errorCliente && <p className="mt-2 text-sm text-error-500">{errorCliente}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="externo-telefono">Teléfono de contacto (opcional)</Label>
            <InputField id="externo-telefono" type="tel" value={telefono} maxLength={20} disabled={ocupado}
              onChange={(e) => setTelefono(e.target.value)} placeholder="999 999 999" />
          </div>
          <div>
            <Label htmlFor="externo-direccion">{esDelivery ? "Dirección de entrega" : "Dirección (opcional)"}</Label>
            <InputField id="externo-direccion" value={direccion} maxLength={150} disabled={ocupado}
              onChange={(e) => setDireccion(e.target.value)} placeholder="Calle, número, distrito" />
          </div>
        </div>

        <div>
          <Label>Observaciones del pedido (opcional)</Label>
          <TextArea value={observaciones} onChange={setObservaciones} rows={3} disabled={ocupado}
            placeholder={esDelivery ? "Ej: Frente al parque, puerta verde. Pagará con S/ 100" : "Ej: Recoge a las 8 p. m., sin cubiertos"} />
        </div>

        {!turnoActivo && (
          <div className="rounded-xl border border-warning-300 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-800 dark:bg-warning-500/10 dark:text-warning-400">
            No tienes un turno abierto. Debes abrir un turno en caja antes de crear pedidos.
          </div>
        )}
        {error && <Alert variant="error" title="No se pudo abrir el pedido" message={error} />}
      </div>
    </FormModal>
  );
}
