"use client";

import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Icon } from "@/components/ui/icon";
import {
  getStoredSession,
  logout,
  type AuthUser,
} from "@/modules/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const session = getStoredSession();
    setUser(session?.user ?? null);
  }, []);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleLogout() {
    closeDropdown();
    logout();
    router.replace("/login");
  }

  const displayName = user?.name ?? "Usuario";
  const displayEmail = user?.email ?? "";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
      >
        <span className="mr-3 h-11 w-11 overflow-hidden rounded-full">
          <Image
            width={44}
            height={44}
            src="/images/user/owner.jpg"
            alt={displayName}
          />
        </span>

        <span className="text-theme-sm mr-1 block font-medium">
          {displayName}
        </span>

        <Icon
          name="mdi:chevron-down"
          size={18}
          className={`text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="shadow-theme-lg dark:bg-gray-dark absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800"
      >
        <div>
          <span className="text-theme-sm block font-medium text-gray-700 dark:text-gray-400">
            {displayName}
          </span>
          {displayEmail ? (
            <span className="text-theme-xs mt-0.5 block text-gray-500 dark:text-gray-400">
              {displayEmail}
            </span>
          ) : null}
        </div>

        <ul className="flex flex-col gap-1 border-b border-gray-200 pt-4 pb-3 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard"
              className="text-theme-sm group flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Icon name="mdi:view-dashboard-outline" size={18} />
              Ir al dashboard
            </DropdownItem>
          </li>
        </ul>

        <button
          type="button"
          onClick={handleLogout}
          className="text-theme-sm group mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <Icon name="mdi:logout" size={18} />
          Cerrar sesión
        </button>
      </Dropdown>
    </div>
  );
}
