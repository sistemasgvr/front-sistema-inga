# Paleta de marca Ingá

Muestreada de los logos oficiales (promedio de píxeles rojos).

| Token | Hex | Origen / uso |
|-------|-----|----------------|
| `brand-500` | `#E51B23` | Rojo de fondo del logo (blanco sobre rojo) — color primario UI |
| `brand-700` | `#B50700` | Rojo tipográfico del logo — énfasis / hover fuerte |
| `brand-600` | `#C41218` | Hover de botones |
| `brand-950` | `#45080A` | Panel auth / fondos brand oscuros |
| `brand-50`…`400` | claros | Fondos suaves, badges, focus rings |

## Logos en `public/images/logo/`

| Archivo | Uso |
|---------|-----|
| `logo-brand.png` | Único asset de marca (rojo, fondo transparente) |

### Uso por contexto (`BrandLogo` / auth)

- **Sidebar / header — modo claro:** color original.
- **Sidebar / header / panel auth — modo oscuro o fondo brand:** máscara blanca (`brightness-0 invert`) + glow.

En Tailwind/CSS: `bg-brand-500`, `text-brand-600`, etc. (`src/app/globals.css` → `@theme`).
