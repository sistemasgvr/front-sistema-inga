"use client";

import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import styles from "./WorkInProgress.module.css";

type WorkInProgressProps = {
  pageTitle?: string;
  title?: string;
  description?: string;
  showAction?: boolean;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

/** Vista compartida para módulos pendientes de implementación. */
export default function WorkInProgress({
  pageTitle,
  title = "Nos encontramos trabajando",
  description = "Estamos preparando esta sección para ti. Pronto encontrarás aquí nuevas herramientas para tu restaurante.",
  showAction = true,
  actionLabel = "Volver al inicio",
  actionHref = "/dashboard",
  className = "",
}: WorkInProgressProps) {
  const router = useRouter();

  return (
    <div className={className}>
      {pageTitle && <PageBreadcrumb pageTitle={pageTitle} />}
      <section className="flex min-h-[480px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center sm:min-h-[560px] sm:py-16 dark:border-gray-800 dark:bg-gray-900">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          En desarrollo
        </span>

        <svg
          viewBox="0 0 320 230"
          fill="none"
          className="my-5 w-full max-w-[320px] text-brand-500 sm:my-7"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="160"
            cy="113"
            r="94"
            className="fill-brand-50 dark:fill-brand-500/10"
          />
          <circle
            cx="160"
            cy="113"
            r="108"
            stroke="currentColor"
            strokeOpacity=".12"
            strokeDasharray="3 9"
          />
          <ellipse
            cx="160"
            cy="200"
            rx="104"
            ry="8"
            className="fill-gray-100 dark:fill-gray-800"
          />

          <g
            className={styles.sparkle}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M49 86v12m-6-6h12M267 130v10m-5-5h10" />
          </g>
          <circle
            cx="258"
            cy="65"
            r="5"
            className="fill-brand-200 dark:fill-brand-800"
          />
          <circle cx="68" cy="150" r="3" fill="currentColor" opacity=".4" />

          <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path className={styles.steam} d="M133 93c-12-12 12-16 0-29" />
            <path
              className={styles.steamMiddle}
              d="M160 81c-12-12 12-16 0-29"
            />
            <path className={styles.steamLast} d="M187 93c-12-12 12-16 0-29" />
          </g>

          <g className={styles.lid}>
            <path
              d="M82 161a78 78 0 0 1 156 0H82Z"
              className="fill-white dark:fill-gray-900"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              d="M92 151a68 68 0 0 1 136 0H92Z"
              className="fill-brand-50 dark:fill-brand-950"
            />
            <path
              d="M110 133a52 52 0 0 1 26-29"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              opacity=".25"
            />
            <path
              d="M149 82v-4a11 11 0 0 1 22 0v4"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M77 163h166"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>

          <path
            d="M69 177h182l-12 13H81l-12-13Z"
            className="fill-brand-100 dark:fill-brand-900"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M60 176h200"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-gray-500 sm:text-base sm:leading-7 dark:text-gray-400">
          {description}
        </p>
        <p className="mt-5 flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-300">
          <span className={styles.dots} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Estamos afinando los detalles
        </p>

        {showAction && (
          <div className="mt-8">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(actionHref)}
              startIcon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m10 5-7 7 7 7M3 12h18"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
