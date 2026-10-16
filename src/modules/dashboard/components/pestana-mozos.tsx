"use client";

import { sumar, TablaReporte, topMozosPorMesas, type ColumnaReporte, type DashboardDatos } from "@/modules/reportes";
import { opcionesBarras } from "../utils/graficos";
import { Grafico } from "./grafico";

type Mozo = ReturnType<typeof topMozosPorMesas>[number];

const COLUMNAS: ColumnaReporte<Mozo>[] = [
  { clave: "nombre", titulo: "Mozo", valor: (m) => m.nombre },
  { clave: "mesas", titulo: "Mesas atendidas", valor: (m) => m.mesas, formato: "numero" },
  { clave: "comensales", titulo: "Comensales", valor: (m) => m.comensales, formato: "numero" },
  { clave: "comensales_por_mesa", titulo: "Comensales por mesa", valor: (m) => m.comensales_por_mesa, formato: "numero" },
  { clave: "total", titulo: "Ventas", valor: (m) => m.total, formato: "moneda" },
  { clave: "ticket", titulo: "Ticket promedio", valor: (m) => m.ticket_promedio, formato: "moneda" },
];

/** Los mozos que más mesas atendieron en el período. */
export function PestanaMozos({ datos }: { datos: DashboardDatos }) {
  const top = topMozosPorMesas(datos.por_mozo, 10);

  return (
    <Grafico
      titulo="Top 10 mozos por mesas atendidas"
      ayuda="Mesas atendidas = pedidos de mesa cobrados por cada mozo en el período (si una mesa se abre dos veces, son dos atenciones). Para llevar y delivery no cuentan como mesa."
      descripcion="Pedidos de mesa cobrados por cada mozo; en la tabla, sus comensales y ventas."
      tipo="bar"
      alto={Math.max(220, top.length * 42)}
      series={[{ name: "Mesas atendidas", data: top.map((m) => m.mesas) }]}
      opciones={opcionesBarras(
        top.map((m) => m.nombre),
        { horizontal: true, moneda: false },
      )}
      vacio={!top.length}
    >
      <div className="mt-4 border-t border-gray-100 pt-2 dark:border-gray-800">
        <TablaReporte
          columnas={COLUMNAS}
          filas={top}
          claveFila={(m) => m.id_mozo}
          totales={{
            mesas: sumar(top, (m) => m.mesas),
            comensales: sumar(top, (m) => m.comensales),
            total: sumar(top, (m) => m.total),
          }}
        />
      </div>
    </Grafico>
  );
}
