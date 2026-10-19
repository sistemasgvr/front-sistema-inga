export interface Empresa {
  id: number;
  ruc: string;
  razonSocial: string;
  direccion: string | null;
  /** Logo original, para PDFs o la futura facturación electrónica. */
  logoUrl: string | null;
  /** Versión en blanco y negro que sale en los tickets (data URL PNG). */
  logoTicket: string | null;
}

export interface EmpresaFormValues {
  ruc: string;
  razonSocial: string;
  direccion: string;
}
