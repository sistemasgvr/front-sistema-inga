"use client";
import { useCallback, useState } from "react";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { listEstaciones } from "@/modules/estaciones/services/estaciones.service";
import { listConvenios } from "@/modules/convenios/services/convenios.service";
import { createPersona } from "@/modules/personas/services/personas.service";
import type {
  ConsultaDocumento,
  PersonaFormValues,
} from "@/modules/personas/types/personas.types";
import { useConsultaDocumento } from "@/modules/personas/hooks/use-consulta-documento";
import { useLista, LISTAS } from "@/modules/listas";
import { useBuscarClientes } from "./use-buscar-clientes";
export const MEDIO_PAGO_CREDITO = 4;

const DNI_CLIENTES_VARIOS = "00000000";

const personaDesdeConsulta = (c: ConsultaDocumento): PersonaFormValues => ({
  tipo_persona: c.tipo_persona,
  tipo_documento: c.tipo_documento,
  num_documento: c.num_documento,
  razon_social: c.razon_social ?? "",
  nombres: c.nombres ?? "",
  apellido_paterno: c.apellido_paterno ?? "",
  apellido_materno: c.apellido_materno ?? "",
  direccion: c.direccion ?? "",
  telefono: "",
  email: "",
  es_cliente: true,
  es_proveedor: false,
  id_convenio: null,
});

export function useCierrePedido(sucursal: number) {
  // El cobro y la precuenta se hacen en el propio resumen; solo el crédito abre un formulario.
  const [creditoAbierto, setCreditoAbierto] = useState(false);
  const [documento, setDocumento] = useState("");
  const [efectivoConfirmado, setEfectivoConfirmado] = useState(false);
  const [tipo, setTipo] = useState("1");
  const [medio, setMedio] = useState("");
  const [documentoCobro, setDocumentoCobro] = useState("");
  const [estacion, setEstacion] = useState("");
  const [nuevo, setNuevo] = useState(false),
    [guardando, setGuardando] = useState(false);
  // Documento del cobro: se consulta al completar 8 (DNI) u 11 (RUC) dígitos.
  const consulta = useConsultaDocumento();
  const [registrando, setRegistrando] = useState(false);
  const cambiarDocumentoCobro = (valor: string) => {
    setDocumentoCobro(valor);
    if (valor !== DNI_CLIENTES_VARIOS) void consulta.consultar(valor);
    else consulta.limpiar();
  };
  /** La factura exige un cliente registrado: lo registra con los datos consultados. */
  async function registrarConsultado() {
    const c = consulta.resultado;
    if (!c || c.origen === "registrado" || registrando) return false;
    setRegistrando(true);
    try {
      await createPersona(personaDesdeConsulta(c));
      await consulta.consultar(c.num_documento);
      return true;
    } finally {
      setRegistrando(false);
    }
  }
  const busqueda = useBuscarClientes(documento);
  const cliente = busqueda.clientes.find(
    (c) => c.num_documento === documento && c.tipo_documento === 1,
  );
  const listaMedios = useLista(LISTAS.MEDIO_PAGO);
  const medios = listaMedios.opciones.filter(
    (o) =>
      o.valor_entero !== null &&
      o.valor_entero !== MEDIO_PAGO_CREDITO &&
      o.codigo !== "CREDITO",
  );
  const estaciones = useLazyOptions(
    useCallback(
      async () =>
        (
          await listEstaciones({
            id_sucursal: sucursal,
            estado: "activos",
            pagina: 1,
            limite: 100,
          })
        ).registros.filter((e) => e.impresora_ip),
      [sucursal],
    ),
  );
  const convenios = useLazyOptions(
    useCallback(
      async () =>
        (await listConvenios({ estado: "activos", pagina: 1, limite: 100 }))
          .registros,
      [],
    ),
  );
  async function crear(values: PersonaFormValues) {
    setGuardando(true);
    try {
      const persona = await createPersona({ ...values, es_cliente: true });
      setDocumento(persona.num_documento ?? "");
      setNuevo(false);
    } finally {
      setGuardando(false);
    }
  }
  /** Al cambiar de comprobante se limpia el documento: DNI y RUC tienen longitudes distintas. */
  const cambiarTipo = (valor: string) => {
    setTipo(valor);
    setDocumentoCobro("");
    consulta.limpiar();
  };
  const reiniciarCobro = () => {
    setMedio("");
    setDocumentoCobro("");
    consulta.limpiar();
  };
  /** Cada apertura empieza limpia: sin DNI previo ni confirmación de efectivo marcada. */
  const abrirCredito = () => {
    setDocumento("");
    setEfectivoConfirmado(false);
    setCreditoAbierto(true);
  };
  return {
    efectivoConfirmado,
    setEfectivoConfirmado,
    creditoAbierto,
    abrirCredito,
    cerrarCredito: () => setCreditoAbierto(false),
    documento,
    setDocumento,
    tipo,
    setTipo: cambiarTipo,
    medio,
    setMedio,
    documentoCobro,
    setDocumentoCobro: cambiarDocumentoCobro,
    consulta,
    registrando,
    registrarConsultado,
    reiniciarCobro,
    medios,
    mediosCargando: listaMedios.isLoading,
    mediosError: listaMedios.error,
    recargarMedios: listaMedios.recargar,
    estacion,
    setEstacion,
    nuevo,
    abrirCliente: () => {
      void convenios.load();
      setNuevo(true);
    },
    cerrarCliente: () => setNuevo(false),
    guardando,
    crear,
    convenios,
    estaciones,
    cliente,
    busqueda,
  };
}
