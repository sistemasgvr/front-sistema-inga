"use client";

import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeTogglerTwo() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="bg-brand-500 hover:bg-brand-600 inline-flex size-14 items-center justify-center rounded-full text-white transition-colors"
      aria-label="Cambiar tema"
    >
      <Icon name="mdi:white-balance-sunny" size={20} className="hidden dark:block" />
      <Icon name="mdi:weather-night" size={20} className="dark:hidden" />
    </button>
  );
}
