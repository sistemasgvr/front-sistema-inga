# Vista de módulo en desarrollo

Componente general: `src/components/common/WorkInProgress.tsx`.
Página de ejemplo: `/en-desarrollo`, dentro del layout autenticado.

```tsx
import WorkInProgress from "@/components/common/WorkInProgress";

export default function MiModuloPage() {
  return (
    <WorkInProgress
      pageTitle="Mi módulo"
      description="Estamos preparando las herramientas de esta sección."
    />
  );
}
```

Propiedades opcionales: `pageTitle` (breadcrumb), `title`, `description`, `showAction`, `actionLabel`, `actionHref` y `className`. Por defecto muestra «Nos encontramos trabajando» y un botón para volver a `/dashboard`. Usar `showAction={false}` para ocultarlo.

Animación SVG/CSS local, con colores de marca, modo oscuro y respeto a `prefers-reduced-motion`. No requiere archivos remotos ni instalar un reproductor de Lottie. No es una pantalla de carga ni un reemplazo para errores de API.
