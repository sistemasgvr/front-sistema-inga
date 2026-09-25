"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type FilterPopoverProps = {
  activeCount?: number;
  onClear?: () => void;
  children: React.ReactNode;
};

export function FilterPopover({ activeCount = 0, onClear, children }: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
          isOpen || activeCount > 0
            ? "border-brand-500 bg-brand-50/50 text-brand-600 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-400"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50"
        }`}
      >
        <Icon name="mdi:filter-variant" size={18} />
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-900 dark:text-white">Filtros</span>
            {activeCount > 0 && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 cursor-pointer"
              >
                <Icon name="mdi:broom" size={14} />
                Limpiar todo
              </button>
            )}
          </div>

          <div className="space-y-3.5">{children}</div>
        </div>
      )}
    </div>
  );
}