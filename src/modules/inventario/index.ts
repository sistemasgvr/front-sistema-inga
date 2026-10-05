export { InventarioView } from "./components/inventario-view";
export { StockTable } from "./components/stock-table";
export { AjusteStockModal } from "./components/ajuste-stock-modal";
export { useStock } from "./hooks/use-stock";
export { listStock, registrarAjusteStock } from "./services/inventario.service";
export type {
  StockItem,
  StockStatusFilter,
  StockResumen,
  ListStockParams,
  RegistrarMovimientoValues,
} from "./types/inventario.types";