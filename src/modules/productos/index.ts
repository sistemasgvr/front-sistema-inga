export { ProductosView } from "./components/productos-view";
export { ProductosTable } from "./components/productos-table";
export { ProductoFormModal } from "./components/producto-form-modal";
export { useProductos } from "./hooks/use-productos";
export {
  listProductos,
  createProducto,
  updateProducto,
  toggleDisponibilidadProducto,
  toggleProductoStatus,
  getUnidadesMedida,
  getInsumosProcesados,
} from "./services/productos.service";
export type {
  ProductoItem,
  ProductoFormValues,
  UnidadMedidaItem,
  ListProductosParams,
  ListProductosResult,
} from "./types/productos.types";