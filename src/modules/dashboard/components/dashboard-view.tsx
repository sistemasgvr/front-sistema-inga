"use client";

import BarChartOne from "@/components/charts/bar/BarChartOne";
import LineChartOne from "@/components/charts/line/LineChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getStoredUser } from "@/modules/auth";
import { useEffect, useState } from "react";

export function DashboardView() {
  const [name, setName] = useState("Usuario");

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      const displayName = user.nombres
        ? `${user.nombres} ${user.apellidos}`.trim()
        : user.username;

      setName(displayName);
    }
  }, []);

  return (
    <div>
      <PageBreadcrumb pageTitle="Dashboard" />

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          Bienvenido, {name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Resumen visual con charts del design system. Pronto se conectarán a las
          métricas y KPIs de la base de datos de Ingá.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ComponentCard title="Tendencia (línea)">
          <LineChartOne />
        </ComponentCard>
        <ComponentCard title="Actividad (barras)">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}