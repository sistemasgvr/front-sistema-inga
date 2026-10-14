/**
 * Banderas de permiso. El valor debe coincidir exactamente con auth_permisos.codigo en la BD.
 */
export const PermisoBanderas = {
  USUARIOS_LISTAR: 'usuarios.listar',
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_ELIMINAR: 'usuarios.eliminar',
  USUARIOS_ACTIVAR: 'usuarios.activar',

  ROLES_LISTAR: 'roles.listar',
  ROLES_VER: 'roles.ver',
  ROLES_CREAR: 'roles.crear',
  ROLES_ACTIVAR: 'roles.activar',
  ROLES_EDITAR: 'roles.editar',
  ROLES_ELIMINAR: 'roles.eliminar',

  CATEGORIAS_LISTAR: 'categorias.listar',
  CATEGORIAS_VER: 'categorias.ver',
  CATEGORIAS_CREAR: 'categorias.crear',
  CATEGORIAS_EDITAR: 'categorias.editar',
  CATEGORIAS_ELIMINAR: 'categorias.eliminar',
  CATEGORIAS_ACTIVAR: 'categorias.activar',

  SUBCATEGORIAS_LISTAR: 'subcategorias.listar',
  SUBCATEGORIAS_VER: 'subcategorias.ver',
  SUBCATEGORIAS_CREAR: 'subcategorias.crear',
  SUBCATEGORIAS_EDITAR: 'subcategorias.editar',
  SUBCATEGORIAS_ELIMINAR: 'subcategorias.eliminar',
  SUBCATEGORIAS_ACTIVAR: 'subcategorias.activar',

  PRODUCTOS_LISTAR: 'productos.listar',
  PRODUCTOS_VER: 'productos.ver',
  PRODUCTOS_CREAR: 'productos.crear',
  PRODUCTOS_EDITAR: 'productos.editar',
  PRODUCTOS_ELIMINAR: 'productos.eliminar',
  PRODUCTOS_ACTIVAR: 'productos.activar',

  ALMACENES_LISTAR: 'almacenes.listar',
  ALMACENES_VER: 'almacenes.ver',
  ALMACENES_CREAR: 'almacenes.crear',
  ALMACENES_EDITAR: 'almacenes.editar',
  ALMACENES_ACTIVAR: 'almacenes.activar',
  ALMACENES_ELIMINAR: 'almacenes.eliminar',

  ESTACIONES_LISTAR: 'estaciones.listar',
  ESTACIONES_VER: 'estaciones.ver',
  ESTACIONES_CREAR: 'estaciones.crear',
  ESTACIONES_EDITAR: 'estaciones.editar',
  ESTACIONES_ACTIVAR: 'estaciones.activar',
  ESTACIONES_ELIMINAR: 'estaciones.eliminar',

  SUCURSALES_LISTAR: 'sucursales.listar',
  SUCURSALES_VER: 'sucursales.ver',
  SUCURSALES_CREAR: 'sucursales.crear',
  SUCURSALES_EDITAR: 'sucursales.editar',
  SUCURSALES_ELIMINAR: 'sucursales.eliminar',
  SUCURSALES_ACTIVAR: 'sucursales.activar',

  PEDIDOS_VER: 'pedidos.ver',
  PEDIDOS_ABRIR: 'pedidos.abrir',
  PEDIDOS_EDITAR: 'pedidos.editar',
  PEDIDOS_COMANDAR: 'pedidos.comandar',
  PEDIDOS_ESTADO: 'pedidos.estado',
  PEDIDOS_COBRAR: 'pedidos.cobrar',
  PEDIDOS_ANULAR: 'pedidos.anular',

  AMBIENTES_LISTAR: 'ambientes.listar',
  AMBIENTES_GESTIONAR: 'ambientes.gestionar',

  PERSONAS_LISTAR: 'personas.listar',
  PERSONAS_VER: 'personas.ver',
  PERSONAS_CREAR: 'personas.crear',
  PERSONAS_EDITAR: 'personas.editar',
  PERSONAS_ELIMINAR: 'personas.eliminar',
  PERSONAS_ACTIVAR: 'personas.activar',

  CONVENIOS_LISTAR: 'convenios.listar',
  CONVENIOS_VER: 'convenios.ver',
  CONVENIOS_CREAR: 'convenios.crear',
  CONVENIOS_EDITAR: 'convenios.editar',
  CONVENIOS_ELIMINAR: 'convenios.eliminar',
  CONVENIOS_ACTIVAR: 'convenios.activar',

  CAJAS_LISTAR: 'cajas.listar',
  CAJAS_VER: 'cajas.ver',
  CAJAS_CREAR: 'cajas.crear',
  CAJAS_EDITAR: 'cajas.editar',
  CAJAS_ELIMINAR: 'cajas.eliminar',
  CAJAS_ACTIVAR: 'cajas.activar',

  TURNOS_LISTAR: 'turnos.listar',
  TURNOS_VER: 'turnos.ver',
  TURNOS_ABRIR: 'turnos.abrir',
  TURNOS_CERRAR: 'turnos.cerrar',
  TURNOS_MOVIMIENTOS: 'turnos.movimientos',
  TURNOS_ARQUEO: 'turnos.arqueo',

  TRABAJADORES_LISTAR: 'trabajadores.listar',
  TRABAJADORES_VER: 'trabajadores.ver',
  TRABAJADORES_CREAR: 'trabajadores.crear',
  TRABAJADORES_EDITAR: 'trabajadores.editar',
  TRABAJADORES_ELIMINAR: 'trabajadores.eliminar',
  TRABAJADORES_ACTIVAR: 'trabajadores.activar',

  PLANILLA_PAGOS_LISTAR: 'planilla.pagos.listar',
  PLANILLA_PAGOS_REGISTRAR: 'planilla.pagos.registrar',
  PLANILLA_PAGOS_ANULAR: 'planilla.pagos.anular',

  GASTOS_CATEGORIAS_LISTAR: 'gastos.categorias.listar',
  GASTOS_CATEGORIAS_GESTIONAR: 'gastos.categorias.gestionar',
  GASTOS_LISTAR: 'gastos.listar',
  GASTOS_REGISTRAR: 'gastos.registrar',
  GASTOS_ANULAR: 'gastos.anular',

  CXP_LISTAR: 'cxp.listar',
  CXP_REGISTRAR_CARGO: 'cxp.cargo',
  CXP_REGISTRAR_ABONO: 'cxp.abono',
  CXP_AJUSTAR: 'cxp.ajustar',

  CXC_LISTAR: 'cxc.listar',
  CXC_REGISTRAR_CONSUMO: 'cxc.consumo',
  CXC_REGISTRAR_ABONO: 'cxc.abono',
  CXC_AJUSTAR: 'cxc.ajustar',

  GDO_LISTAR: 'gdo.listar',
  GDO_REGISTRAR: 'gdo.registrar',
  GDO_ANULAR: 'gdo.anular',
  GDO_INSUMOS_GESTIONAR: 'gdo.insumos.gestionar',

  SUNAT_LISTAR: 'sunat.listar',
  SUNAT_VER: 'sunat.ver',
  SUNAT_CREAR: 'sunat.crear',
  SUNAT_EDITAR: 'sunat.editar',
  SUNAT_ELIMINAR: 'sunat.eliminar',
  SUNAT_ACTIVAR: 'sunat.activar',

  INVENTARIO_VER: 'inventario.ver',
  INVENTARIO_GESTIONAR: 'inventario.gestionar',

  PRODUCCION_PREPARAR: 'produccion.preparar',

  PEDIDOS_ENTREGAR: 'pedidos.entregar',
} as const;

export type PermisoBandera =
  (typeof PermisoBanderas)[keyof typeof PermisoBanderas];

export const TODAS_LAS_BANDERAS: PermisoBandera[] =
  Object.values(PermisoBanderas);
