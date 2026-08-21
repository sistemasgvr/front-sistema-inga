"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredToken, getMe, AUTH_STORAGE_KEY } from "../services/auth.service";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function verifySession() {
      const token = getStoredToken();
      
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const user = await getMe();

        if (user) {
          setReady(true);
        } else {
          throw new Error("Sesión inválida");
        }
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        router.replace("/login");
      }
    }

    setReady(false); 
    verifySession();
  }, [pathname, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}