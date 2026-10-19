import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { EstadoCuentaDetalleView } from "@/modules/cuentas-por-cobrar";

/** Estado de cuenta de un cliente con el detalle de cada pedido, para imprimir o exportar. */
export default async function EstadoCuentaClientePage(props: PageProps<"/cuentas-por-cobrar/clientes/[idPersona]">) {
  const { idPersona } = await props.params;
  return (
    <RoleGuard requiredPermission="cxc.listar">
      <EstadoCuentaDetalleView idPersona={Number(idPersona)} />
    </RoleGuard>
  );
}
