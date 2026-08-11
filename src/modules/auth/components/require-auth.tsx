"use client";

import { getStoredSession } from "../services/auth.service";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Validando sesión...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
