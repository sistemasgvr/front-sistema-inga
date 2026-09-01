"use client";

import Checkbox from "@/components/form/input/Checkbox";

type RoleCheckboxCardProps = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  isChecked: boolean;
  onToggle: () => void;
};

export function RoleCheckboxCard({
  id,
  nombre,
  descripcion,
  isChecked,
  onToggle,
}: RoleCheckboxCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
        isChecked
          ? "border-brand-500/30 bg-brand-50/50 dark:border-brand-500/20 dark:bg-brand-500/10"
          : "border-gray-200 bg-white hover:bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:bg-gray-800/40"
      }`}
    >
      <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
        <Checkbox
          id={`role-${id}`}
          checked={isChecked}
          onChange={onToggle}
        />
      </div>
      <div className="select-none">
        <span className="block text-sm font-bold text-gray-800 dark:text-white">
          {nombre}
        </span>
        {descripcion && (
          <span className="block text-xs text-gray-400 mt-0.5">
            {descripcion}
          </span>
        )}
      </div>
    </div>
  );
}