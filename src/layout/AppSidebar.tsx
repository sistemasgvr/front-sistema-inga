"use client";

import BrandLogo from "@/components/common/BrandLogo";
import { Icon } from "@/components/ui/icon";
import { useSidebar } from "@/context/SidebarContext";
import { getStoredUser } from "@/modules/auth/services/auth.service"; 
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  permission?: string;
  subItems?: {
    name: string;
    icon: string;
    path: string;
    pro?: boolean;
    new?: boolean;
  }[];
};

const navItems: NavItem[] = [
  {
    icon: "mdi:view-dashboard-outline",
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: "mdi:account-group-outline",
    name: "Usuarios",
    path: "/users",
    permission: "usuarios.listar", 
  },
  {
    icon: "mdi:shield-key-outline",
    name: "Roles y Permisos",
    path: "/roles",
    permission: "roles.listar", 
  },
  {
    icon: "mdi:silverware-fork-knife",
    name: "Productos",
    subItems: [
      {
        name: "Catálogo",
        path: "/productos",
        icon: "mdi:format-list-bulleted",
      },
      {
        name: "Categorías",
        path: "/productos/categorias",
        icon: "mdi:shape-outline",
      },
      {
        name: "Subcategorías",
        path: "/productos/subcategorias",
        icon: "mdi:file-tree-outline",
      },
    ],
  },
  {
    icon: "mdi:account-multiple-outline",
    name: "Personas",
    permission: "personas.listar",
    subItems: [
      {
        name: "Clientes y proveedores",
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
    permission: "turnos.ver",
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
    icon: "mdi:account-cash-outline",
    name: "Planilla",
    permission: "planilla.pagos.listar",
    subItems: [
      {
        name: "Pagos de planilla",
        path: "/planilla",
        icon: "mdi:cash-clock",
      },
      {
        name: "Personal",
        path: "/planilla/trabajadores",
        icon: "mdi:account-hard-hat-outline",
      },
    ],
  },
  {
    icon: "mdi:receipt-text-outline",
    name: "Gastos",
    permission: "gastos.listar",
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
    icon: "mdi:warehouse",
    name: "Almacenes",
    path: "/almacenes",
    permission: "ALMACENES_LISTAR",
  },
  {
    icon: "mdi:printer-settings",
    name: "Estaciones",
    path: "/estaciones",
    permission: "ESTACIONES_LISTAR",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, openSubmenu, toggleSubmenu } = useSidebar();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const authUser = getStoredUser();
    setCurrentUser(authUser);
  }, []);

  const isActive = (path: string) => path === pathname;

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true; 
    if (currentUser?.es_super_admin) return true;
    return currentUser?.permisos?.includes(item.permission);
  });

  // Abro solo el submenú que contiene la ruta actual, y SOLO cuando cambia la
  // ruta.
  //
  // Antes este efecto dependía también de `filteredNavItems`, que se recalcula
  // en cada render y por lo tanto es un array nuevo cada vez. Resultado: el
  // efecto corría en cada render. Si yo estaba en /productos/categorias y abría
  // el menú "Caja", cambiaba `openSubmenu` → se re-renderizaba → el efecto
  // volvía a correr → veía que la ruta seguía siendo la de Productos y
  // reabría "Productos", cerrando "Caja" al instante. Por eso no se podía
  // abrir otro menú con hijos, pero sí navegar a uno sin hijos: ahí la ruta
  // cambiaba y el efecto ya no tenía nada que reabrir.
  //
  // Dependiendo solo de `pathname`, el efecto corre al navegar y no vuelve a
  // pelearse con lo que el usuario abre a mano.
  useEffect(() => {
    const navDeLaRuta = navItems.find((nav) =>
      nav.subItems?.some((subItem) => subItem.path === pathname),
    );

    if (navDeLaRuta && openSubmenu !== navDeLaRuta.name) {
      toggleSubmenu(navDeLaRuta.name);
    }
    // `openSubmenu` y `toggleSubmenu` quedan fuera a propósito: si los incluyera
    // volvería a correr cuando el usuario abre otro menú, que es justo el bug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => {
        const isSubmenuOpen = openSubmenu === nav.name;
        const hasSubItems = Boolean(nav.subItems && nav.subItems.length > 0);

        return (
          <li key={nav.name}>
            {hasSubItems ? (
              <button
                type="button"
                onClick={() => toggleSubmenu(nav.name)}
                className={`menu-item group ${
                  isSubmenuOpen ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span className={`${isSubmenuOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  <Icon name={nav.icon} size={22} />
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <Icon
                    name="mdi:chevron-down"
                    size={20}
                    className={`ml-auto transition-transform duration-200 ${
                      isSubmenuOpen ? "text-brand-500 rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                    <Icon name={nav.icon} size={22} />
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {hasSubItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  // max-h generoso a propósito: solo actúa como tope para que
                  // la transición de apertura tenga a dónde animar. Con 3 ítems
                  // el valor anterior (max-h-40 = 160px) ya cortaba el último.
                  isSubmenuOpen ? "max-h-96 mt-2" : "max-h-0"
                }`}
              >
                <ul className="ml-9 space-y-1">
                  {nav.subItems!.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        <Icon name={subItem.icon} size={18} />
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 dark:border-gray-800 dark:bg-gray-900 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex py-8 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <BrandLogo priority />
          ) : (
            <BrandLogo compact priority />
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs leading-[20px] text-gray-400 uppercase ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menú"
                ) : (
                  <Icon name="mdi:dots-horizontal" size={20} />
                )}
              </h2>
              {renderMenuItems(filteredNavItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;