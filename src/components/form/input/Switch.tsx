import type React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  title?: string;
}

/** Interruptor on/off para preferencias que se aplican al instante. */
const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, id, disabled = false, title }) => (
  <label
    title={title}
    className={`inline-flex items-center gap-2.5 select-none ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
  >
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed ${
        checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-theme-xs transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
    {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
  </label>
);

export default Switch;
