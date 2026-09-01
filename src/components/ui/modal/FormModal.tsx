"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, ReactNode } from "react";

type FormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  title: string;
  subtitle?: string;
  isSaving: boolean;
  maxWidth?: string;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
};

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  isSaving,
  maxWidth = "max-w-[640px]",
  children,
  submitText = "Guardar",
  cancelText = "Cancelar",
}: FormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={`${maxWidth} p-0 overflow-hidden flex flex-col`}>
      <form onSubmit={onSubmit} className="flex flex-col max-h-[85vh]">
        {/* Cabecera fija */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Cuerpo scrolleable con el hover arreglado exclusivamente para el thumb */}
        <div 
          className="px-6 lg:px-8 py-6 overflow-y-auto space-y-4 flex-1 
          [&::-webkit-scrollbar]:w-3 
          [&::-webkit-scrollbar-track]:bg-gray-50 dark:[&::-webkit-scrollbar-track]:bg-gray-950/50 
          [&::-webkit-scrollbar-track]:my-1
          [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-thumb]:border-[2px] 
          [&::-webkit-scrollbar-thumb]:border-solid 
          [&::-webkit-scrollbar-thumb]:border-transparent 
          [&::-webkit-scrollbar-thumb]:bg-clip-padding
          [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600
          [&::-webkit-scrollbar-thumb:active]:bg-gray-500 dark:[&::-webkit-scrollbar-thumb:active]:bg-gray-500"
        >
          {children}
        </div>

        {/* Pie de página fijo */}
        <div className="px-6 py-4 lg:px-8 flex w-full items-center justify-end gap-3 border-t border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 shrink-0">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={isSaving}>
            {cancelText}
          </Button>
          <Button size="sm" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}