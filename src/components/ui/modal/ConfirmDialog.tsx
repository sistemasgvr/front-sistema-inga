"use client";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[480px] p-6 lg:p-8">
      <div className="flex flex-col items-center text-center">
        {/* Ícono de Advertencia TailAdmin */}
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isDanger
              ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
              : "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
          }`}
        >
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>

        <div className="flex w-full items-center justify-end gap-3 sm:justify-center">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto ${
              isDanger
                ? "bg-error-600 hover:bg-error-700 dark:bg-error-500"
                : ""
            }`}
          >
            {isLoading ? "Procesando..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}