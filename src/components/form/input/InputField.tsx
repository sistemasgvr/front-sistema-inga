"use client";
import React, { FC, useState, useEffect } from "react";
import { normalizarDecimal, validarDecimal } from "@/shared/utils/decimal";
import { MONTO_MAXIMO } from "@/shared/constants/limites";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onKeyDown,
  className = "",
  min,
  max,
  maxLength,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
}) => {
  const numeric = type === "number";
  // Todo campo numérico tiene tope: sin él, 12 cifras terminaban en "Error interno".
  const maxEfectivo = numeric ? (max ?? String(MONTO_MAXIMO)) : max;
  const [draft, setDraft] = useState(String(value ?? defaultValue ?? ""));
  const [focused, setFocused] = useState(false);
  const [mensaje, setMensaje] = useState("");
  useEffect(() => {
    if (focused) return;
    const actual = String(value ?? defaultValue ?? "");
    setDraft(actual);
    if (numeric) setMensaje(validarDecimal(actual, min, maxEfectivo, step));
  }, [value, defaultValue, focused, numeric, min, maxEfectivo, step]);
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!numeric) { onChange?.(event); return; }
    const raw = event.target.value;
    setDraft(raw);
    const message = validarDecimal(raw, min, maxEfectivo, step);
    event.target.setCustomValidity(message);
    setMensaje(message);
    const normalized = normalizarDecimal(raw);
    if (normalized === "" || /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
      const target = new Proxy(event.target, { get: (node, key) => key === "value" ? normalized : Reflect.get(node, key, node) });
      onChange?.({ ...event, target, currentTarget: target });
    }
  }
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error || mensaje) {
    inputClasses += ` text-error-800 border-error-500 focus:ring-3 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500`;
  } else if (success) {
    inputClasses += ` text-success-500 border-success-400 focus:ring-success-500/10 focus:border-success-300 dark:text-success-400 dark:border-success-500`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <input
        type={numeric ? "text" : type}
        inputMode={numeric ? "decimal" : undefined}
        id={id}
        name={name}
        placeholder={placeholder}
        value={numeric ? draft : value}
        defaultValue={numeric ? undefined : defaultValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (numeric && !validarDecimal(draft, min, maxEfectivo, step)) setFocused(false);
          onBlur?.(event);
        }}
        onKeyDown={onKeyDown}
        min={min}
        max={maxEfectivo}
        maxLength={maxLength}
        step={step}
        disabled={disabled}
        className={inputClasses}
      />

      {/* El motivo del rechazo se ve junto al campo, no solo como botón apagado. */}
      {mensaje ? (
        <p className="mt-1.5 text-xs text-error-500">{mensaje}</p>
      ) : hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;