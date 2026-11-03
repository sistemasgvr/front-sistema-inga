"use client";

import BrandLogo from "@/components/common/BrandLogo";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import BuscadorGlobal from "@/components/header/BuscadorGlobal";
import UserDropdown from "@/components/header/UserDropdown";
import { SelectorSucursal } from "@/modules/auth";
import { Icon } from "@/components/ui/icon";
import { useSidebar } from "@/context/SidebarContext";
import { IndicadorImpresion } from "@/modules/impresion";
import { CampanaNotificaciones } from "@/modules/notificaciones";
import Link from "next/link";
import React, { useState } from "react";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4 dark:border-gray-800">
          <button
            type="button"
            className="z-99999 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:flex lg:h-11 lg:w-11 lg:border dark:border-gray-800 dark:text-gray-400"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            <Icon
              name={isMobileOpen ? "mdi:close" : "mdi:menu"}
              size={isMobileOpen ? 24 : 22}
            />
          </button>

          <Link href="/dashboard" className="lg:hidden">
            <BrandLogo size="sm" />
          </Link>

          {/* Buscador: ícono en reposo, se despliega con clic o Ctrl/Cmd+K. */}
          <BuscadorGlobal />

          <button
            type="button"
            onClick={() => setApplicationMenuOpen((prev) => !prev)}
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Abrir menú"
          >
            <Icon name="mdi:dots-horizontal" size={22} />
          </button>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } shadow-theme-md w-full items-center justify-between gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <SelectorSucursal />
            <Link
              href="/ambientes/mesas"
              aria-label="Ir a mesas"
              title="Ir a mesas"
              onClick={() => setApplicationMenuOpen(false)}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <Icon name="mdi:receipt-text-outline" size={20} />
            </Link>
            <IndicadorImpresion />
            <ThemeToggleButton />
            <CampanaNotificaciones />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
