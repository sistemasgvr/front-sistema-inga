import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/toast/ToastContext";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "flatpickr/dist/flatpickr.css";
import "./globals.css";
const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema Inga",
  description: "Sistema de gestión Inga",
  icons: {
    icon: { url: "/images/logo/icono.png", type: "image/png" },
    shortcut: "/images/logo/icono.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        suppressHydrationWarning
        className={`${outfit.className} dark:bg-gray-900`}
      >
        <ThemeProvider>
          <SidebarProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
