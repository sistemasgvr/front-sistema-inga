export interface Distrito {
  id: number;
  ubigeo: string | null;
  distrito: string;
  provincia: string;
  departamento: string;
}

export interface Empresa {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  direccion: string | null;
  /** Domicilio fiscal: su ubigeo es obligatorio para emitir a SUNAT. */
  idDistrito: number | null;
  distrito: Distrito | null;
  /** Tasa de IGV (%) del régimen vigente; se copia a cada pedido al abrirlo. */
  tasaIgv: number;
  /** Logo original, para PDFs o la futura facturación electrónica. */
  logoUrl: string | null;
  /** Versión en blanco y negro que sale en los tickets (data URL PNG). */
  logoTicket: string | null;
}

export interface EmpresaFormValues {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccion: string;
  idDistrito: number | null;
  tasaIgv: string;
}
