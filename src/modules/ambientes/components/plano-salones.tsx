"use client";
import { Rnd } from "react-rnd";
import { Icon } from "@/components/ui/icon";
import { ESTADOS_MESA } from "../types/ambientes.types";
import type { GeometriaSalon, Mesa, Salon } from "../types/ambientes.types";

type Props = {
  salones: Salon[];
  mesas: Mesa[];
  selectedId: number | null;
  editable: boolean;
  disabled: boolean;
  onSelect: (id: number) => void;
  onMove: (id: number, geometry: GeometriaSalon) => void;
};

export function PlanoSalones({
  salones,
  mesas,
  selectedId,
  editable,
  disabled,
  onSelect,
  onMove,
}: Props) {
  const width = Math.max(
    1200,
    ...salones.map((s) => Number(s.posicion_x) + Number(s.ancho) + 120),
  );
  const height = Math.max(
    650,
    ...salones.map((s) => Number(s.posicion_y) + Number(s.alto) + 120),
  );
  function persist(
    s: Salon,
    x: number,
    y: number,
    ancho = Number(s.ancho),
    alto = Number(s.alto),
  ) {
    onMove(Number(s.id), {
      posicion_x: Math.min(10000, Math.max(0, Math.round(x))),
      posicion_y: Math.min(10000, Math.max(0, Math.round(y))),
      ancho,
      alto,
    });
  }
  return (
    <div
      className="overflow-auto rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950"
      aria-label="Plano de salones"
    >
      <div
        className="relative"
        style={{
          width,
          height,
          backgroundImage:
            "radial-gradient(var(--color-gray-300) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {!salones.length && (
          <div className="absolute left-8 top-8 max-w-sm rounded-xl bg-white p-6 text-sm text-gray-500 shadow-theme-sm dark:bg-gray-900">
            No hay salones activos en esta sucursal. Crea un salón para comenzar
            a organizar las mesas.
          </div>
        )}
        {salones.map((s) => {
          const selected = selectedId === Number(s.id);
          const items = mesas.filter(
            (m) => Number(m.id_salon) === Number(s.id) && m.estado === 1,
          );
          return (
            <Rnd
              key={s.id}
              position={{ x: Number(s.posicion_x), y: Number(s.posicion_y) }}
              size={{ width: Number(s.ancho), height: Number(s.alto) }}
              minWidth={200}
              minHeight={150}
              maxWidth={5000}
              maxHeight={5000}
              bounds="parent"
              dragGrid={[10, 10]}
              resizeGrid={[10, 10]}
              dragHandleClassName="salon-drag-handle"
              disableDragging={!editable || disabled}
              enableResizing={editable && !disabled}
              onDragStop={(_, d) => persist(s, d.x, d.y)}
              onResizeStop={(_, __, ref, ___, position) =>
                persist(
                  s,
                  position.x,
                  position.y,
                  Math.round(parseFloat(ref.style.width)),
                  Math.round(parseFloat(ref.style.height)),
                )
              }
              style={{ zIndex: selected ? 2 : 1 }}
              className={`rounded-xl border-2 bg-white shadow-theme-sm dark:bg-gray-900 ${selected ? "border-brand-500" : "border-gray-300 dark:border-gray-700"}`}
            >
              <section
                className="flex h-full flex-col overflow-hidden rounded-xl"
                aria-label={s.nombre}
              >
                <button
                  type="button"
                  onClick={() => onSelect(Number(s.id))}
                  className={`salon-drag-handle flex w-full shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-2 text-left dark:border-gray-800 ${editable ? "cursor-move" : "cursor-pointer"} ${selected ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-800 dark:text-white"}`}
                >
                  <Icon
                    name={editable ? "mdi:drag" : "mdi:floor-plan"}
                    size={20}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {s.nombre}
                  </span>
                  <span className="text-xs">{items.length}</span>
                </button>
                <div className="grid flex-1 content-start grid-cols-[repeat(auto-fill,minmax(75px,1fr))] gap-2 overflow-auto p-3">
                  {items.map((m) => {
                    const status = ESTADOS_MESA[m.estado_mesa];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelect(Number(s.id))}
                        aria-label={`Mesa ${m.codigo}, ${status.label}, ${m.capacidad_personas} personas`}
                        className={`flex min-h-20 flex-col items-center justify-center rounded-lg border p-2 ${status.className}`}
                      >
                        <Icon name="mdi:table-chair" size={22} />
                        <span className="max-w-full truncate text-xs font-bold">
                          {m.codigo}
                        </span>
                        <span className="text-[10px]">{status.label}</span>
                        <span className="text-[10px]">
                          {m.capacidad_personas} pers.
                        </span>
                      </button>
                    );
                  })}
                  {!items.length && (
                    <p className="col-span-full py-3 text-xs text-gray-400">
                      Sin mesas. Selecciona este salón para agregar una.
                    </p>
                  )}
                </div>
              </section>
            </Rnd>
          );
        })}
      </div>
    </div>
  );
}
