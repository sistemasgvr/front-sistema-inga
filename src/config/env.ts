/**
 * Configuración de entorno del front (valores estáticos de desarrollo).
 * Si existe NEXT_PUBLIC_API_URL en .env.local, tiene prioridad.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
} as const;
