import { redirect } from "next/navigation";

/**
 * La bandeja de SUNAT se integró en /ventas como pestañas. La ruta se conserva
 * porque hay enlaces y notificaciones antiguas que apuntan acá.
 */
export default function ComprobantesSunatPage() {
  redirect("/ventas?tab=dia");
}
