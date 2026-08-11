"use client";

import { Icon } from "@/components/ui/icon";
import React from "react";
import Badge from "../ui/badge/Badge";

export const EcommerceMetrics = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Icon
            name="mdi:account-group-outline"
            size={24}
            className="text-gray-800 dark:text-white/90"
          />
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers
            </span>
            <h4 className="text-title-sm mt-2 font-bold text-gray-800 dark:text-white/90">
              3,782
            </h4>
          </div>
          <Badge color="success">
            <Icon name="mdi:arrow-up" size={16} />
            11.01%
          </Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Icon
            name="mdi:package-variant-closed"
            size={24}
            className="text-gray-800 dark:text-white/90"
          />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Orders
            </span>
            <h4 className="text-title-sm mt-2 font-bold text-gray-800 dark:text-white/90">
              5,359
            </h4>
          </div>

          <Badge color="error">
            <Icon name="mdi:arrow-down" size={16} className="text-error-500" />
            9.05%
          </Badge>
        </div>
      </div>
    </div>
  );
};
