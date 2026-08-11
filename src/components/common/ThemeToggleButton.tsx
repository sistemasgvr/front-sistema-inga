"use client";

import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggleButton() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <Icon name="mdi:white-balance-sunny" size={20} className="hidden dark:block" />
      <Icon name="mdi:weather-night" size={20} className="dark:hidden" />
    </button>
  );
};
