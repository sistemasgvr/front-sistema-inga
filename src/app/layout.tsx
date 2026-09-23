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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/*
        suppressHydrationWarning va acá porque las extensiones del navegador
        (ColorZilla, Grammarly y compañía) le inyectan atributos al <body> antes
        de que React arranque, y eso hace que el HTML del servidor y el del
        navegador no coincidan. React lo reporta como error de hidratación
        aunque nuestro código esté bien.

        Solo silencia diferencias de atributos EN ESTE elemento: no baja a los
        hijos, así que un mismatch real dentro de la app se va a seguir viendo.
      */}
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