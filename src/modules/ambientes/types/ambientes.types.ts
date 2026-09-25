export type EstadoMesa = 1 | 2 | 3 | 4;
export type GeometriaSalon = {
  posicion_x: number;
  posicion_y: number;
  ancho: number;
  alto: number;
};
export type Salon = GeometriaSalon & {
  id: number;
  id_sucursal: number;
  codigo: string;
  nombre: string;
  estado: number;
};
export type Mesa = {
  id: number;
  id_salon: number;
  codigo: string;
  capacidad_personas: number;
  estado_mesa: EstadoMesa;
  estado: number;
};
export type SucursalAmbiente = { id: number; codigo: string; nombre: string };
export type SalonForm = GeometriaSalon & {
  id_sucursal: number;
  codigo: string;
  nombre: string;
};
export type MesaForm = {
  id_salon: number;
  codigo: string;
  capacidad_personas: number;
  estado_mesa: EstadoMesa;
};
export type Feedback = {
  variant: "success" | "error" | "info";
  title: string;
  message: string;
};
export const ESTADOS_MESA: Record<
  EstadoMesa,
  { label: string; className: string; icon: string }
> = {
  1: {
    label: "Libre",
    className:
      "border-success-300 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-500/10 dark:text-success-400",
    icon: "mdi:check-circle-outline",
  },
  2: {
    label: "Ocupada",
    className:
      "border-error-300 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400",
    icon: "mdi:account-group-outline",
  },
  3: {
    label: "Por cobrar",
    className:
      "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-500/10 dark:text-warning-400",
    icon: "mdi:cash-clock",
  },
  4: {
    label: "Inhabilitada",
    className:
      "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
    icon: "mdi:cancel",
  },
};
