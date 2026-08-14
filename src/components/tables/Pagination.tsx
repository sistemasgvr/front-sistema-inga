"use client";

import React from "react";
import {
  createPaginationRange,
  getPaginationSummary,
} from "@/shared/utils/pagination.utils";

type PaginationProps = {
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) => {
  const summary = getPaginationSummary(currentPage, pageSize, totalItems);
  const pages = createPaginationRange(currentPage, totalPages);

  if (totalItems <= 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        Mostrando <span className="font-medium text-gray-800 dark:text-white">{summary.from}</span> a{" "}
        <span className="font-medium text-gray-800 dark:text-white">{summary.to}</span> de{" "}
        <span className="font-medium text-gray-800 dark:text-white">{summary.total}</span> registros
      </p>

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="shadow-theme-xs mr-2.5 flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Anterior
        </button>

        <div className="flex items-center gap-1.5">
          {pages.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            const isCurrent = item === currentPage;

            return (
              <button
                type="button"
                key={item}
                onClick={() => onPageChange(item)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-brand-500 text-white"
                    : "text-gray-700 hover:bg-blue-500/[0.08] hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="shadow-theme-xs ml-2.5 flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Pagination;