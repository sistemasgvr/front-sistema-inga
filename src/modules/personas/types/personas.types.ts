export type PersonaStatus = 1 | 0;

/** Catálogo PERSONA_TIPO de la base. */
export const TIPO_PERSONA = { NATURAL: 1, JURIDICA: 2 } as const;

/** Catálogo DOCUMENTO_TIPO. Los números son los códigos de SUNAT. */
export const TIPO_DOCUMENTO = { DNI: 1, CE: 4, RUC: 6, PASAPORTE: 7 } as const;

export const REGLAS_DOCUMENTO: Record<
  number,
  { etiqueta: string; longitud: number | null; soloNumeros: boolean; ayuda: string }
> = {
  [TIPO_DOCUMENTO.PASAPORTE]: {
    etiqueta: "Pasaporte", longitud: null, soloNumeros: false, ayuda: "Entre 1 y 20 caracteres alfanuméricos",
  },
  [TIPO_DOCUMENTO.DNI]: {
    etiqueta: "DNI",
    longitud: 8,
    soloNumeros: true,
    ayuda: "8 dígitos",
  },
  [TIPO_DOCUMENTO.RUC]: {
    etiqueta: "RUC",
    longitud: 11,
    soloNumeros: true,
    ayuda: "11 dígitos",
  },
  [TIPO_DOCUMENTO.CE]: {
    etiqueta: "Carné de extranjería",
    longitud: null,
    soloNumeros: false,
    ayuda: "entre 8 y 12 caracteres",
  },
};

export type PersonaItem = {
  id: number;
  tipo_persona: number;
  tipo_persona_nombre: string | null;
  tipo_documento: number;
  tipo_documento_nombre: string | null;
  num_documento: string;
  razon_social: string | null;
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  /** Nombre ya armado por la base: nombres + apellidos, o la razón social. */
  nombre_completo: string | null;
  direccion: string | null;
  id_distrito: number | null;
  nombre_distrito: string | null;
  telefono: string | null;
  email: string | null;
  es_cliente: boolean;
  es_proveedor: boolean;
  id_convenio: number | null;
  nombre_convenio: string | null;
  limite_credito: number | null;
  /** Solo llega en el detalle (GET por id) y en el buscador. */
  saldo_credito?: number;
  estado: PersonaStatus;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type PersonaFormValues = {
  tipo_persona: number;
  tipo_documento: number;
  num_documento: string;
  razon_social: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  telefono: string;
  email: string;
  es_cliente: boolean;
  es_proveedor: boolean;
  id_convenio: number | null;
};

export type PersonaStatusFilter = "todos" | "activos" | "inactivos";
export type PersonaRolFilter = "todos" | "clientes" | "proveedores";

export type PersonasResumen = {
  total: number;
  activos: number;
  inactivos: number;
  clientes: number;
  proveedores: number;
};

export type ListPersonasParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: PersonaStatusFilter;
  rol?: PersonaRolFilter;
  id_convenio?: number;
};

export type ListPersonasResult = {
  registros: PersonaItem[];
  total: number;
  resumen?: PersonasResumen;
};

/** Resultado reducido del buscador rápido que usan compras y cobros. */
export type PersonaBusquedaItem = {
  id: number;
  tipo_persona: number;
  /** El documento es opcional (ej. clientes de delivery). */
  tipo_documento: number | null;
  tipo_documento_nombre: string | null;
  num_documento: string | null;
  nombre_completo: string | null;
  telefono: string | null;
  direccion: string | null;
  es_cliente: boolean;
  es_proveedor: boolean;
  id_convenio: number | null;
  nombre_convenio: string | null;
  limite_credito: number | null;
  saldo_credito: number;
};

/** Distrito propuesto por la consulta de RUC (padrón SUNAT). */
export type DistritoConsulta = {
  id: number;
  ubigeo: string;
  distrito: string;
  provincia: string;
  departamento: string;
};

/** Respuesta de GET /personas/consulta/:numero (DNI o RUC). */
export type ConsultaDocumento = {
  /** registrado = cliente de la empresa; reniec / sunat = consulta externa, aún no registrado. */
  origen: "registrado" | "reniec" | "sunat";
  id_persona: number | null;
  tipo_persona: number;
  tipo_documento: number;
  num_documento: string;
  nombre: string;
  razon_social: string | null;
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  nombre_comercial: string | null;
  direccion: string | null;
  distrito: DistritoConsulta | null;
  estado: string | null;
  condicion: string | null;
  es_cliente: boolean;
};
