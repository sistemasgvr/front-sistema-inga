# Iconos — Iconify

Usamos [Iconify](https://iconify.design/) vía `@iconify/react` y el wrapper del sistema.

## Componente

```tsx
import { Icon } from "@/components/ui/icon";

<Icon name="mdi:home" />
<Icon name="mdi:account" size={20} color="#E51B23" />
<Icon name="lucide:search" className="text-brand-500" size="1.5rem" />
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `name` | `string` | — | Id Iconify (`prefijo:nombre`) |
| `size` | `number \| string` | `1.25rem` | Ancho y alto |
| `color` | `string` | `currentColor` | Color (iconos monocromo) |
| `className` | `string` | — | Clases Tailwind |
| `rotate` | `0\|1\|2\|3\|…` | — | Rotación |
| `flip` | `horizontal\|vertical\|both` | — | Espejo |
| `aria-label` | `string` | — | Accesible; si no hay label, `aria-hidden` |

## Buscar iconos

Catálogo: [icon-sets.iconify.design](https://icon-sets.iconify.design/)

Ejemplos habituales: `mdi:*`, `lucide:*`, `solar:*`, `heroicons:*`.

## Convención

Usar siempre `import { Icon } from "@/components/ui/icon"` en pantallas y componentes del sistema. Evitar SVGs inline y el barrel `@/icons` (legado TailAdmin).

## Nota Next.js

El componente es client (`"use client"`). Los SVG se resuelven en el cliente desde la API de Iconify.
