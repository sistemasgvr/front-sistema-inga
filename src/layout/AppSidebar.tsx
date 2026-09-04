"use client";

import BrandLogo from "@/components/common/BrandLogo";
import { Icon } from "@/components/ui/icon";
import { useSidebar } from "@/context/SidebarContext";
import { getMe, getStoredUser } from "@/modules/auth/services/auth.service"; 
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

type SubNavItem = {
  name: string;
  path: string;
  permission?: string;
  pro?: boolean;
  new?: boolean;
};

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  permission?: string; 
  subItems?: SubNavItem[];
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
    permission: PermisoBanderas.USUARIOS_LISTAR, 
  },
  {
    icon: "mdi:shield-key-outline",
    name: "Roles y Permisos",
    path: "/roles",
    permission: PermisoBanderas.ROLES_LISTAR, 
  },
  {
    icon: "mdi:silverware-fork-knife",
    name: "Productos",
    subItems: [
      { 
        name: "Catálogo", 
        path: "/productos", 
        permission: PermisoBanderas.PRODUCTOS_LISTAR 
      },
      { 
        name: "Categorías", 
        path: "/productos/categorias", 
        permission: PermisoBanderas.CATEGORIAS_LISTAR 
      },
      { 
        name: "Subcategorías", 
        path: "/productos/subcategorias", 
        permission: PermisoBanderas.SUBCATEGORIAS_LISTAR 
      },
    ],
  },
  {
    icon: "mdi:warehouse",
    name: "Almacenes",
    path: "/almacenes",
    permission: PermisoBanderas.ALMACENES_LISTAR,
  },
  {
    icon: "mdi:printer-settings",
    name: "Estaciones",
    path: "/estaciones",
    permission: PermisoBanderas.ESTACIONES_LISTAR,
  },
  {
    icon: "mdi:form-select",
    name: "Formularios",
    path: "/form-elements",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, openSubmenu, toggleSubmenu } = useSidebar();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function syncSidebarSession() {
      const stored = getStoredUser();
      if (stored) {
        setCurrentUser(stored);
      }

      try {
        const fresh = await getMe();
        if (fresh) {
          setCurrentUser(fresh);
        }
      } catch {
        // En caso de fallo el guard redirige a login
      }
    }

    void syncSidebarSession();
  }, []);

  const isActive = (path: string) => path === pathname;

  const isSuperAdmin = Boolean(
    currentUser?.es_super_admin || 
    currentUser?.esSuperAdmin || 
    currentUser?.sesion?.es_super_admin
  );

  const userPermisos: string[] = 
    currentUser?.permisos ?? 
    currentUser?.sesion?.permisos ?? 
    [];

  function hasAccess(permission?: string): boolean {
    if (!permission) return true;
    if (isSuperAdmin) return true;
    return userPermisos.includes(permission);
  }

  // Filtrado recursivo de la navegación
  const filteredNavItems = navItems
    .map((item) => {
      // Si el ítem principal requiere un permiso directo y no lo tiene, se descarta
      if (item.permission && !hasAccess(item.permission)) {
        return null;
      }

      // Si tiene subítems, se filtran según los permisos del usuario
      if (item.subItems && item.subItems.length > 0) {
        const allowedSubItems = item.subItems.filter((sub) => hasAccess(sub.permission));
        
        // Si no tiene acceso a ningún subítem, se oculta el menú padre completo
        if (allowedSubItems.length === 0) {
          return null;
        }

        return {
          ...item,
          subItems: allowedSubItems,
        };
      }

      return item;
    })
    .filter(Boolean) as NavItem[];

  useEffect(() => {
    filteredNavItems.forEach((nav) => {
      nav.subItems?.forEach((subItem) => {
        if (isActive(subItem.path) && openSubmenu !== nav.name) {
          toggleSubmenu(nav.name);
        }
      });
    });
  }, [pathname, filteredNavItems]);

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
                  isSubmenuOpen ? "max-h-40 mt-2" : "max-h-0"
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