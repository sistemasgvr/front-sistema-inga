"use client";

import React from "react";

export interface TabItem {
  id: string | number;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface NavTabsProps {
  tabs: TabItem[];
  activeTab: string | number;
  onChange: (id: any) => void;
  className?: string;
}

export function NavTabs({ tabs, activeTab, onChange, className = "" }: NavTabsProps) {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-800 ${className}`}>
      <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-2.5 px-3.5 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab.icon && (
                <span className={isActive ? "text-brand-500 dark:text-brand-400" : "text-gray-400"}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}