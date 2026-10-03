<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Selectores y actualización de datos

Regla explícita del usuario para implementaciones futuras:
- Cada cambio de opción en un selector que determina datos remotos (salón → mesas, sucursal → salones, filtros, listas o búsquedas dependientes) debe ejecutar una nueva petición al backend con la selección actual, incluso al volver a una opción ya visitada. No sustituirla por filtrado local o por un resultado almacenado.
- Mantener la carga de opciones remotas al abrir el selector. Esto no sustituye la petición de los datos dependientes al cambiar la selección.
- Implementar las peticiones en servicios/hooks reutilizables; el componente comunica el cambio de selección.
- Cancelar o ignorar respuestas anteriores cuando se cambia rápidamente de opción. Mostrar carga/error y limpiar las selecciones dependientes para no presentar datos del contexto anterior.

## Arquitectura modular

- Seguir el patrón de los módulos existentes: `components/`, `hooks/`, `services/`, `types/` y `utils/`, con `index.ts` como entrada pública del módulo.
- Ubicar los contextos compartidos del módulo en `context/` cuando sean necesarios.
- Los componentes presentan la interfaz; los hooks gestionan estado y operaciones; los servicios encapsulan las peticiones HTTP y las integraciones externas.
- No acumular componentes, servicios, tipos y utilidades como archivos sueltos en la raíz del módulo.
- Al mover archivos, corregir imports de pantallas, referencias entre módulos y rutas utilizadas por las pruebas. Verificar compilación y pruebas correspondientes.
