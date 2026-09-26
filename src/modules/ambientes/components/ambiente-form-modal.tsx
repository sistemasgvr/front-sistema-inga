"use client";
import { useState } from "react";
import { LISTA_IDS, opcionesParaSelect, useLista } from "@/modules/listas";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import type {
  EstadoMesa,
  Mesa,
  MesaForm,
  Salon,
  SalonForm,
} from "../types/ambientes.types";

type Common = { isSaving: boolean; onClose: () => void; error?: string };

export function SalonFormModal({
  salon,
  sucursalId,
  onSubmit,
  ...props
}: Common & {
  salon?: Salon;
  sucursalId: number;
  onSubmit: (values: SalonForm) => Promise<void>;
}) {
  const [values, setValues] = useState<SalonForm>({
    id_sucursal: sucursalId,
    codigo: salon?.codigo ?? "",
    nombre: salon?.nombre ?? "",
    posicion_x: Number(salon?.posicion_x ?? 20),
    posicion_y: Number(salon?.posicion_y ?? 20),
    ancho: Number(salon?.ancho ?? 360),
    alto: Number(salon?.alto ?? 260),
  });
  const [validation, setValidation] = useState("");
  function field(name: keyof SalonForm, value: string | number) {
    setValues((v) => ({ ...v, [name]: value }));
  }
  return (
    <FormModal
      isOpen
      onClose={props.onClose}
      title={salon ? "Editar salón" : "Nuevo salón"}
      subtitle="Define una zona y su ubicación en el plano."
      isSaving={props.isSaving}
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !values.codigo.trim() ||
          values.codigo.trim().length > 50 ||
          !values.nombre.trim() ||
          values.nombre.trim().length > 100
        ) {
          setValidation(
            "Completa el código (máximo 50 caracteres) y el nombre (máximo 100).",
          );
          return;
        }
        if (
          ![
            values.posicion_x,
            values.posicion_y,
            values.ancho,
            values.alto,
          ].every(Number.isFinite) ||
          values.posicion_x < 0 ||
          values.posicion_x > 10000 ||
          values.posicion_y < 0 ||
          values.posicion_y > 10000 ||
          values.ancho < 200 ||
          values.ancho > 5000 ||
          values.alto < 150 ||
          values.alto > 5000
        ) {
          setValidation("X e Y: 0–10000. Ancho: 200–5000. Alto: 150–5000.");
          return;
        }
        setValidation("");
        void onSubmit(values);
      }}
    >
      {(validation || props.error) && (
        <Alert
          variant="error"
          title="Revisa los datos"
          message={validation || props.error!}
        />
      )}
      <div>
        <Label htmlFor="salon-codigo">Código</Label>
        <Input
          id="salon-codigo"
          value={values.codigo}
          disabled={props.isSaving}
          onChange={(e) => field("codigo", e.target.value)}
          placeholder="SAL-01"
        />
      </div>
      <div>
        <Label htmlFor="salon-nombre">Nombre del salón</Label>
        <Input
          id="salon-nombre"
          value={values.nombre}
          disabled={props.isSaving}
          onChange={(e) => field("nombre", e.target.value)}
          placeholder="Salón principal"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(
          [
            { key: "posicion_x", label: "Posición X", min: 0, max: 10000 },
            { key: "posicion_y", label: "Posición Y", min: 0, max: 10000 },
            { key: "ancho", label: "Ancho", min: 200, max: 5000 },
            { key: "alto", label: "Alto", min: 150, max: 5000 },
          ] as const
        ).map((f) => (
          <div key={f.key}>
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              type="number"
              min={String(f.min)}
              max={String(f.max)}
              step={0.01}
              value={values[f.key]}
              disabled={props.isSaving}
              onChange={(e) =>
                field(
                  f.key,
                  e.target.value === "" ? NaN : Number(e.target.value),
                )
              }
            />
          </div>
        ))}
      </div>
    </FormModal>
  );
}


export function MesaFormModal({
  mesa,
  salon,
  onSubmit,
  ...props
}: Common & {
  mesa?: Mesa;
  salon: Salon;
  onSubmit: (values: MesaForm) => Promise<void>;
}) {
  const [codigo, setCodigo] = useState(mesa?.codigo ?? "");
  const [capacidad, setCapacidad] = useState(
    Number(mesa?.capacidad_personas ?? 2),
  );
  const estados = useLista(LISTA_IDS.MESA_ESTADO);
  // El mantenimiento solo permite estas transiciones; nombres y valores llegan de BD.
  const opcionesEstado = opcionesParaSelect(
    estados.opciones.filter(
      (o) => o.codigo === "LIBRE" || o.codigo === "INHABILITADA",
    ),
  );
  const [estado, setEstado] = useState<number>(mesa?.estado_mesa ?? 0);
  const estadoValido = opcionesEstado.some((o) => o.value === String(estado));
  const [validation, setValidation] = useState("");
  return (
    <FormModal
      isOpen
      onClose={props.onClose}
      title={mesa ? "Editar mesa" : "Nueva mesa"}
      subtitle={salon.nombre}
      isSaving={props.isSaving}
      submitDisabled={
        estados.isLoading || Boolean(estados.error) || !estadoValido
      }
      onSubmit={(e) => {
        e.preventDefault();
        if (estados.isLoading || estados.error || !estadoValido) return;
        if (
          !codigo.trim() ||
          codigo.trim().length > 20 ||
          !Number.isInteger(capacidad) ||
          capacidad < 1 ||
          capacidad > 100
        ) {
          setValidation(
            "Completa un código de hasta 20 caracteres y una capacidad de 1 a 100 personas.",
          );
          return;
        }
        setValidation("");
        void onSubmit({
          id_salon: Number(salon.id),
          codigo: codigo.trim(),
          capacidad_personas: capacidad,
          estado_mesa: estado as EstadoMesa,
        });
      }}
    >
      {(validation || props.error) && (
        <Alert
          variant="error"
          title="Revisa los datos"
          message={validation || props.error!}
        />
      )}
      <div>
        <Label htmlFor="mesa-codigo">Código de mesa</Label>
        <Input
          id="mesa-codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          disabled={props.isSaving}
          placeholder="M-01"
        />
      </div>
      <div>
        <Label htmlFor="mesa-capacidad">Capacidad (personas)</Label>
        <Input
          id="mesa-capacidad"
          type="number"
          min="1"
          max="100"
          value={capacidad}
          onChange={(e) => setCapacidad(Number(e.target.value))}
          disabled={props.isSaving}
        />
      </div>
      <div>
        <Label>Disponibilidad</Label>
        {(estados.error ||
          (!estados.isLoading && opcionesEstado.length === 0)) && (
          <div role="alert" className="mb-2 text-sm text-error-600">
            {estados.error ?? "No hay estados disponibles."}{" "}
            <button
              type="button"
              onClick={estados.recargar}
              className="underline"
            >
              Reintentar
            </button>
          </div>
        )}
        <Select
          defaultValue={estadoValido ? String(estado) : ""}
          placeholder={
            estados.isLoading ? "Cargando estados..." : "Selecciona un estado"
          }
          onChange={(v) => setEstado(Number(v))}
          disabled={
            props.isSaving || estados.isLoading || Boolean(estados.error)
          }
          options={opcionesEstado}
        />
      </div>
      <p className="text-xs text-gray-500">
        Los estados Ocupada y Por cobrar se actualizarán desde el flujo de
        pedidos.
      </p>
    </FormModal>
  );
}
