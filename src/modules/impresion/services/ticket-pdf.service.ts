import { apiGetBlob } from '@/shared/api/api-client';

/**
 * Descarga el PDF (forma de ticket de 58 mm) que el backend genera y archiva en
 * Storage. `ruta` es el endpoint según el permiso del módulo, por ejemplo
 * `/ventas/comprobantes/:id/pdf` o `/impresion/:id/pdf`.
 */
export async function descargarTicketPdf(ruta: string, nombre: string) {
  const archivo = await apiGetBlob(ruta);
  const url = URL.createObjectURL(new Blob([archivo], { type: 'application/pdf' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombre.replace(/[^\w-]+/g, '_')}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
