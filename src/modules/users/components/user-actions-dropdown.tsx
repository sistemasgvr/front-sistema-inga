"use client";

import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Icon } from "@/components/ui/icon";
import { useState } from "react";
import type { User } from "../types/user.types";

type UserActionsDropdownProps = {
  user: User;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
};

export function UserActionsDropdown({
  user,
  onEdit,
  onToggleStatus,
}: UserActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleEdit() {
    setIsOpen(false);
    onEdit(user);
  }

  function handleToggle() {
    setIsOpen(false);
    onToggleStatus(user);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="dropdown-toggle hover:text-gray-700 dark:hover:text-gray-300 p-1"
        aria-label={`Acciones de ${user.username}`}
      >
        <Icon name="mdi:dots-horizontal" size={20} />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="shadow-theme-lg dark:bg-gray-dark absolute right-0 z-40 w-44 rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-800"
      >
        <DropdownItem
          onItemClick={handleEdit}
          className="text-theme-sm flex w-full cursor-pointer rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Editar
        </DropdownItem>
        <DropdownItem
          onItemClick={handleToggle}
          className="text-theme-sm flex w-full cursor-pointer rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {user.estado === 1 ? "Desactivar" : "Activar"}
        </DropdownItem>
      </Dropdown>
    </div>
  );
}