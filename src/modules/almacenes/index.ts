export { AlmacenesView } from "./components/almacenes-view";
export { AlmacenesTable } from "./components/almacenes-table";
export { AlmacenFormModal } from "./components/almacen-form-modal";
export { useAlmacenes } from "./hooks/use-almacenes";
export { listAlmacenes, createAlmacen, updateAlmacen, toggleAlmacenStatus } from "./services/almacenes.service";
export type { AlmacenItem, AlmacenFormValues, AlmacenStatusFilter } from "./types/almacenes.types";