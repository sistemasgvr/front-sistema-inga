export interface QzConfiguracion {
  configurado: boolean;
  origen: 'base' | 'archivo' | null;
  sujeto?: string;
  vence?: string;
  huella?: string;
  actualizado?: string;
}
