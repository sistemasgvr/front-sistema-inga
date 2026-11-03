import { PermisoBanderas } from "@/shared/constants/permiso-banderas";

export type SubNavItem = {
  name: string;
  path: string;
  icon?: string;
  permission?: string | string[];
  pro?: boolean;
  new?: boolean;
};

export type NavItem = {
  name: string;
  icon: string;
  path?: string;
  permission?: string | string[];
  subItems?: SubNavItem[];
};

export const navItems: NavItem[] = [
  {
    icon: "mdi:view-dashboard-outline",
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: "mdi:floor-plan",
    name: "Ambientes",
    permission: PermisoBanderas.AMBIENTES_LISTAR,
    subItems: [
      {
        name: "Distribución",
        path: "/ambientes/distribucion",
        icon: "mdi:map-marker-radius-outline",
      },
      {
        name: "Mesas",
        path: "/ambientes/mesas",
        icon: "ic:round-table-restaurant",
      },
    ],
  },

  {
    icon: "mdi:silverware-fork-knife",
    name: "Productos",
    subItems: [
      {
        name: "Catálogo",
        path: "/productos",
        icon: "mdi:format-list-bulleted",
        permission: PermisoBanderas.PRODUCTOS_LISTAR,
      },
      {
        name: "Categorías",
        path: "/productos/subcategorias",
        icon: "mdi:file-tree-outline",
        permission: [PermisoBanderas.CATEGORIAS_LISTAR, PermisoBanderas.SUBCATEGORIAS_LISTAR],
      },
      {
        name: "Cocina y preparaciones",
        path: "/productos/cocina",
        icon: "mdi:chef-hat",
        permission: PermisoBanderas.PRODUCCION_PREPARAR,
      },
      {
        name: "Stock",
        path: "/productos/stock",
        icon: "at-icons:cube",
        permission: PermisoBanderas.INVENTARIO_VER,
      },
    ],
  },
  {
    icon: "mdi:account-multiple-outline",
    name: "Clientes",
    permission: PermisoBanderas.PERSONAS_LISTAR,
    subItems: [
      {
        name: "Listado general",
        path: "/personas",
        icon: "mdi:card-account-details-outline",
      },
      {
        name: "Convenios",
        path: "/personas/convenios",
        icon: "mdi:handshake-outline",
      },
      {
        name: "Cuentas por cobrar",
        path: "/cuentas-por-cobrar",
        icon: "mdi:cash-plus",
      },
      {
        name: "Cuentas por pagar",
        path: "/cuentas-por-pagar",
        icon: "mdi:cash-remove",
      },
    ],
  },
  {
    icon: "mdi:cash-register",
    name: "Caja",
    permission: PermisoBanderas.TURNOS_VER,
    subItems: [
      {
        name: "Mi turno",
        path: "/caja",
        icon: "mdi:cash-clock",
      },
      {
        name: "Historial de turnos",
        path: "/caja/turnos",
        icon: "mdi:clipboard-text-clock-outline",
      },
      {
        name: "Cajas físicas",
        path: "/caja/cajas",
        icon: "mdi:cash-register",
      },
    ],
  },
  {
    icon: "mdi:receipt-text-outline",
    name: "Gastos",
    permission: PermisoBanderas.GASTOS_LISTAR,
    subItems: [
      {
        name: "Compras del día",
        path: "/gastos/diarios",
        icon: "mdi:cart-outline",
      },
      {
        name: "Gastos del mes",
        path: "/gastos",
        icon: "mdi:cash-minus",
      },
      {
        name: "Categorías",
        path: "/gastos/categorias",
        icon: "mdi:folder-outline",
      },
    ],
  },
  {
    icon: "mdi:file-chart-outline",
    name: "Reportes",
    subItems: [
      {
        icon: "mdi:receipt-text-check-outline",
        name: "Ventas",
        path: "/ventas",
        permission: PermisoBanderas.VENTAS_LISTAR,
      },
      {
        icon: "ri:file-paper-2-line",
        name: "Comprobantes SUNAT",
        path: "/ventas/sunat",
        permission: PermisoBanderas.SUNAT_LISTAR,
      },
      {
        name: "Reporte general",
        path: "/reportes",
        icon: "mdi:file-chart-outline",
        permission: PermisoBanderas.REPORTES_GENERAL,
      },
      {
        name: "Ventas y platos",
        path: "/reportes/ventas",
        icon: "mdi:silverware-fork-knife",
        permission: PermisoBanderas.REPORTES_VENTAS,
      },
      {
        name: "Gastos",
        path: "/reportes/gastos",
        icon: "mdi:cash-minus",
        permission: PermisoBanderas.REPORTES_GASTOS,
      },
      {
        name: "Caja",
        path: "/reportes/caja",
        icon: "mdi:cash-register",
        permission: PermisoBanderas.REPORTES_CAJA,
      },
      {
        name: "Cuentas",
        path: "/reportes/cuentas",
        icon: "mdi:scale-balance",
        permission: PermisoBanderas.REPORTES_CUENTAS,
      },
      {
        name: "Planilla",
        path: "/reportes/planilla",
        icon: "mdi:account-cash-outline",
        permission: PermisoBanderas.REPORTES_PLANILLA,
      },
      {
        name: "Inventario",
        path: "/reportes/inventario",
        icon: "mdi:package-variant-closed",
        permission: PermisoBanderas.REPORTES_INVENTARIO,
      },
    ],
  },
  {
    icon: "clarity:employee-group-solid",
    name: "Personal",
    subItems: [
      {
        name: "Trabajadores",
        path: "/planilla/trabajadores",
        permission: PermisoBanderas.TRABAJADORES_LISTAR,
        icon: "mdi:account-hard-hat-outline",
      },
      {
        name: "Usuarios",
        path: "/users",
        icon: "ci:users",
        permission: PermisoBanderas.USUARIOS_LISTAR,
      },
      {
        name: "Pagos de planilla",
        path: "/planilla",
        permission: PermisoBanderas.PLANILLA_PAGOS_LISTAR,
        icon: "mdi:cash-clock",
      },
    ],
  },

  {
    icon: "clarity:settings-solid",
    name: "Configuración",
    subItems: [
      {
        icon: "mdi:domain",
        name: "Empresa",
        path: "/configuracion/empresa",
        permission: PermisoBanderas.EMPRESA_VER,
      },
      {
        icon: "mdi:shield-key-outline",
        name: "Roles y Permisos",
        path: "/configuracion/roles",
        permission: PermisoBanderas.ROLES_LISTAR,
      },
      {
        icon: "mdi:printer-settings",
        name: "Estaciones",
        path: "/estaciones",
        permission: PermisoBanderas.ESTACIONES_LISTAR,
      },
      {
        icon: "mdi:warehouse",
        name: "Almacenes",
        path: "/almacenes",
        permission: PermisoBanderas.ALMACENES_LISTAR,
      },
    ],
  },
];

/**
 * Descarta los ítems para los que el usuario no tiene permiso.
 *
 * Un padre con hijos se conserva solo si le queda al menos un hijo visible;
 * si no, se oculta entero (mostrarlo abriría un submenú vacío).
 */
export function filtrarNavegacion(
  items: NavItem[],
  tienePermiso: (permission?: string | string[]) => boolean,
): NavItem[] {
  return items
    .map((item) => {
      if (item.permission && !tienePermiso(item.permission)) {
        return null;
      }

      if (item.subItems && item.subItems.length > 0) {
        const permitidos = item.subItems.filter((sub) =>
          tienePermiso(sub.permission),
        );
        if (permitidos.length === 0) return null;
        return { ...item, subItems: permitidos };
      }

      return item;
    })
    .filter(Boolean) as NavItem[];
}

export type RutaNavegable = {
  nombre: string;
  ruta: string;
  icono: string;
  /** Menú padre, para mostrar «Productos › Catálogo» en el buscador. */
  seccion?: string;
};

/** Aplana el árbol a las rutas que realmente se pueden abrir. */
export function rutasNavegables(items: NavItem[]): RutaNavegable[] {
  const rutas: RutaNavegable[] = [];

  for (const item of items) {
    if (item.path) {
      rutas.push({ nombre: item.name, ruta: item.path, icono: item.icon });
    }
    for (const sub of item.subItems ?? []) {
      if (!sub.path) continue;
      rutas.push({
        nombre: sub.name,
        ruta: sub.path,
        icono: sub.icon ?? item.icon,
        seccion: item.name,
      });
    }
  }

  return rutas;
}
