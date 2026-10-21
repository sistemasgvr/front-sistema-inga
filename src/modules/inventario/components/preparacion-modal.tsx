"use client";

import { ToastNotification } from "@/components/ui/toast/ToastNotification";
import { FormModal } from "@/components/ui/modal/FormModal";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Badge from "@/components/ui/badge/Badge";
import { usePreparacion } from "../hooks/use-preparacion";
import type {
  CocinaItem,
  IngredienteDisponibilidad,
} from "../types/cocina.types";

// Platos compuestos (Barco): sub-platos tomados del stock, sub-platos con ingredientes y lo directo del plato.
function agrupar(ingredientes: IngredienteDisponibilidad[], plato: string) {
  const grupos = new Map<
    string,
    {
      titulo: string;
      preparado: boolean;
      orden: number;
      filas: IngredienteDisponibilidad[];
    }
  >();
  for (const x of ingredientes) {
    const [clave, titulo, orden] = x.preparado
      ? [`p-${x.id_producto}`, x.nombre, 0]
      : x.id_producto_origen
        ? [`o-${x.id_producto_origen}`, x.origen ?? x.ruta, 1]
        : ["directo", plato ? `Directo del ${plato}` : "Directo", 2];
    const g = grupos.get(clave) ?? {
      titulo,
      preparado: x.preparado,
      orden,
      filas: [],
    };
    g.filas.push(x);
    grupos.set(clave, g);
  }
  return [...grupos.values()].sort((a, b) => a.orden - b.orden);
}

export function PreparacionModal({
  sucursal,
  item,
  onClose,
  onSaved,
}: {
  sucursal: number;
  item: CocinaItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const p = usePreparacion(sucursal, item, onSaved);
  return (
    <FormModal
      isOpen
      onClose={() => {
        if (!p.saving) onClose();
      }}
      title={
        item
          ? `Estás comenzando con la preparación del plato: ${item.nombre_producto}`
          : "Preparación anticipada"
      }
      subtitle={
        item ? (
          <>
            Confirma que tienes los insumos. Al confirmar{" "}
            <span className="font-bold text-amber-500">
              se descontarán del almacén
            </span>
            .
          </>
        ) : (
          <>
            Confirma cuando los platos esten listos,{" "}
            <span className="font-bold text-amber-500">
              se descontarán del almacén
            </span>{" "}
            y se marcarán como listos <br /> para servir.
          </>
        )
      }
      isSaving={p.saving}
      submitDisabled={!p.puedeGuardar}
      submitText={
        item
          ? "Confirmar e iniciar preparación"
          : "Confirmar preparación terminada"
      }
      onSubmit={async (e) => {
        e.preventDefault();
        await p.guardar();
      }}
    >
      {p.error && (
        <ToastNotification
          variant="error"
          title="Preparación"
          message={p.error}
        />
      )}
      {item && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          CANT: {p.cantidad}{" "}
          <span className="font-normal">
            · {p.cantidad === 1 ? "plato a preparar" : "platos a preparar"}
          </span>
        </p>
      )}
      {!item && (
        <div>
          <Label>Selecciona el Platillo con receta</Label>
          <Select
            options={p.productos.options.map((x) => ({
              value: String(x.id),
              label: `${x.nombre} · Stock: ${Number(x.stock_libre ?? 0)}`,
            }))}
            defaultValue={p.producto}
            onChange={p.cambiarProducto}
            onOpen={() => void p.productos.load()}
            isLoading={p.productos.isLoading}
            loadError={p.productos.error}
            disabled={p.saving}
          />
        </div>
      )}
      {!item && (
        <div>
          <Label>Ingresa la cantidad</Label>
          <Input
            type="number"
            min="1"
            step={0.0001}
            value={p.cantidad}
            disabled={p.saving}
            onChange={(e) => p.setCantidad(Number(e.target.value))}
          />
        </div>
      )}
      {p.loading && <p role="status">Consultando ingredientes…</p>}
      {p.disponibilidad && (
        <>
          {!item && (
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <p>
                Máximo a preparar (según stock):{" "}
                <strong className="font-bold text-amber-500">
                  {Number(p.disponibilidad.posibles_preparar)}
                </strong>
              </p>
              <p>
                Listos para servir:{" "}
                <strong className="font-bold text-green-500">
                  {Number(p.disponibilidad.libres ?? 0)}
                </strong>
              </p>
            </div>
          )}

          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Los insumos o platos que necesitas son:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-2 pl-3">Ingrediente</th>
                  <th className="py-2">Necesario</th>
                  <th className="py-2">Disponible</th>
                  <th className="py-2">Falta</th>
                </tr>
              </thead>
              {agrupar(p.disponibilidad.ingredientes, p.plato).map((g) => (
                <tbody key={g.titulo + g.orden}>
                  <tr className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <th
                      colSpan={4}
                      className="pt-3 pb-2 pl-3 font-semibold text-gray-900 dark:text-white"
                    >
                      {g.titulo}{" "}
                      {g.preparado ? (
                        <Badge size="sm" color="success">
                          Tenemos stock ya listo
                        </Badge>
                      ) : (
                        g.orden === 1 && (
                          <Badge size="sm" color="light">
                            con ingredientes
                          </Badge>
                        )
                      )}
                    </th>
                  </tr>
                  {g.filas.map((x) => (
                    <tr
                      key={`${x.id_producto}-${x.id_producto_origen ?? 0}`}
                      className="border-t border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="py-2 pl-3 text-gray-900 dark:text-gray-200">
                        {x.nombre}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">
                        {Number(x.requerido)} {x.simbolo}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">
                        {Number(x.disponible)}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">
                        {Number(x.faltante)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
          {item && (
            <Checkbox
              id="preparacion_confirmar_insumos"
              label="Confirmo que ya tengo los insumos y autorizo descontarlos del almacén."
              checked={p.insumosConfirmados}
              disabled={p.saving || p.loading}
              onChange={p.setInsumosConfirmados}
            />
          )}
        </>
      )}
    </FormModal>
  );
}
