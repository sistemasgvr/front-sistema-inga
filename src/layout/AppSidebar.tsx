"use client";

import BrandLogo from "@/components/common/BrandLogo";
import { Icon } from "@/components/ui/icon";
import { useSidebar } from "@/context/SidebarContext";
import { getMe, getStoredUser } from "@/modules/auth/services/auth.service";
import type { AuthUser } from "@/modules/auth";
import { filtrarNavegacion, navItems, type NavItem } from "@/config/navegacion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

/**
 * El login y `/auth/me` no devuelven exactamente la misma forma: la sesión
 * anidada puede traer `permisos` y `es_super_admin`, que son los que mira el
 * filtrado de abajo. Se declara acá en vez de usar `any` en el estado.
 */
type UsuarioSidebar = AuthUser & {
  esSuperAdmin?: boolean;
  sesion?: AuthUser["sesion"] & { permisos?: string[] };
};

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    openSubmenu,
    toggleSubmenu,
  } = useSidebar();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<UsuarioSidebar | null>(null);

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
    currentUser?.sesion?.es_super_admin,
  );

  const userPermisos: string[] =
    currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];

  function hasAccess(permission?: string | string[]): boolean {
    if (!permission) return true;
    if (isSuperAdmin) return true;
    return Array.isArray(permission)
      ? permission.some((p) => userPermisos.includes(p))
      : userPermisos.includes(permission);
  }

  // Filtrado recursivo de la navegación. La lista vive en `config/navegacion`
  // porque el buscador del header la necesita también.
  const filteredNavItems = filtrarNavegacion(navItems, hasAccess);

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
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`${isSubmenuOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
                >
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
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
                  >
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
                        {subItem.icon && <Icon name={subItem.icon} size={18} />}
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
      <div
        className={`flex py-8 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
      >
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
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
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
