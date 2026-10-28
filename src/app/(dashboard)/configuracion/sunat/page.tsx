import { redirect } from "next/navigation";

/** La configuración SUNAT vive en Configuración → Empresa. */
export default function SunatPage() {
  redirect("/configuracion/empresa");
}
