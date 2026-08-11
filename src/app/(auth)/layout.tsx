import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-1 bg-white p-6 dark:bg-gray-900 sm:p-0">
      <div className="relative flex h-screen w-full flex-col justify-center dark:bg-gray-900 lg:flex-row sm:p-0">
        {children}

        <div className="bg-brand-950 hidden h-full w-full items-center dark:bg-white/5 lg:grid lg:w-1/2">
          <div className="relative z-1 flex items-center justify-center">
            <GridShape />
            <div className="flex max-w-xs flex-col items-center">
              <Link href="/login" className="mb-4 block">
                <Image
                  width={231}
                  height={48}
                  src="/images/logo/auth-logo.svg"
                  alt="Sistema Inga"
                />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                Sistema de gestión Inga
              </p>
            </div>
          </div>
        </div>

        <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
