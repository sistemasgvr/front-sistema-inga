"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

export interface Option {
  value: string;
  label: string;
}

export interface SelectProps {
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  searchableThreshold?: number;
  onOpen?: () => void;
  isLoading?: boolean;
  loadError?: string | null;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Seleccione una opción",
  searchPlaceholder = "Buscar...",
  onChange,
  className = "",
  defaultValue = "",
  disabled = false,
  error = false,
  hint,
  searchableThreshold = 7,
  onOpen,
  isLoading = false,
  loadError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [previousDefault, setPreviousDefault] = useState(defaultValue);
  if (previousDefault !== defaultValue) {
    setPreviousDefault(defaultValue);
    setSelectedValue(defaultValue);
  }

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const shouldShowSearch = options.length > searchableThreshold;
  const filteredOptions = shouldShowSearch
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onChange(value);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => {
          if (!isOpen) onOpen?.();
          setIsOpen(!isOpen);
        }}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left text-sm font-medium shadow-xs transition-all duration-200 cursor-pointer
          ${
            error
              ? "border-error-500 ring-3 ring-error-500/10 dark:border-error-500"
              : isOpen
                ? "border-brand-500 ring-3 ring-brand-500/10 dark:border-brand-500"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
          }
          ${disabled ? "cursor-not-allowed bg-gray-100 opacity-60 dark:bg-gray-800" : "dark:bg-gray-900"}
        `}
      >
        <span
          className={`truncate ${
            selectedOption
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <span
          className={`ml-2 text-gray-400 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? "rotate-180 text-brand-500 dark:text-brand-400" : ""
          }`}
        >
          <Icon name="mdi:chevron-down" size={20} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 max-h-64 min-w-full w-max max-w-[340px] overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl transition-all dark:border-gray-800 dark:bg-gray-900">
          {shouldShowSearch && (
            <div className="relative mb-1.5 p-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 pl-8 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
                <Icon name="mdi:magnify" size={16} />
              </span>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {isLoading ? (
              <div
                role="status"
                className="px-3 py-2 text-center text-xs text-gray-500"
              >
                Cargando opciones...
              </div>
            ) : loadError ? (
              <div role="alert" className="px-3 py-2 text-xs text-error-500">
                {loadError}
                <button
                  type="button"
                  onClick={onOpen}
                  className="mt-2 block font-medium underline"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-gray-400">
                No hay coincidencias
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === selectedValue;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <span className="whitespace-nowrap">{option.label}</span>
                    {isSelected && (
                      <Icon
                        name="mdi:check"
                        size={18}
                        className="text-brand-500 dark:text-brand-400 shrink-0"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {hint && (
        <p
          className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Select;
