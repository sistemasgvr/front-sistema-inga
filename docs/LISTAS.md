# Consumir listas desde cualquier vista

El módulo `src/modules/listas` contiene constantes, tipos, servicios, utilidades y un hook. No crea página, menú ni componentes visuales.

## En un componente cliente

```tsx
import Select from "@/components/form/Select";
import { LISTA_IDS, useLista } from "@/modules/listas";

const tipos = useLista(LISTA_IDS.ESTACION_TIPO, { enabled: isOpen });

<Select
  options={tipos.selectOptions}
  defaultValue={String(tipoSeleccionado ?? "")}
  onChange={value => setTipoSeleccionado(Number(value))}
  disabled={tipos.isLoading || Boolean(tipos.error)}
  placeholder={tipos.isLoading ? "Cargando..." : "Selecciona un tipo"}
/>
```

Cada vista muestra `tipos.error` y ofrece `tipos.recargar()` para reintentar. Antes de guardar, comprobar que la selección pertenece a `selectOptions`. Si no hay opciones activas, mostrar el estado vacío y bloquear el guardado; no recuperar una lista fija como fallback.

El hook devuelve `lista`, `opciones`, `selectOptions`, `isLoading`, `error` y `recargar`. Cancela consultas al desmontar o cambiar de catálogo y evita mostrar resultados de otro catálogo. Consulta de nuevo al reabrir un formulario con `enabled`; no guarda opciones en localStorage ni en una caché permanente.

## Desde cualquier archivo TypeScript

```ts
import {
  LISTA_IDS,
  listarListas,
  obtenerLista,
  obtenerOpcionesLista,
  opcionesParaSelect,
} from "@/modules/listas";

const opciones = await obtenerOpcionesLista(LISTA_IDS.PRODUCTO_TIPO);
const selectOptions = opcionesParaSelect(opciones);

// También admite un ID real consultado en la API; no suponer números del seed.
const listas = await listarListas();
const lista = listas.find(item => item.id === LISTA_IDS.MESA_ESTADO);
if (lista) await obtenerLista(lista.id);
```

Los servicios reutilizan el cliente autenticado existente. Para llamadas sin React se puede importar directamente desde `services/listas.service.ts`.

## Valores y reglas

- `LISTA_IDS` contiene los IDs numéricos reales de `gen_lista`, administrados manualmente en `src/modules/listas/constants/lista-ids.ts`. Los nombres y opciones llegan de la base.
- Por defecto, el valor del select es `String(valor_entero)`. Opciones con valor nulo se omiten, sin convertirlas en cero.
- Para campos que guardan código o una FK al registro de la opción: `useLista(idLista, { campoValor: "codigo" })` o `"id"`. La misma selección está disponible en `opcionesParaSelect(opciones, campo)`.
- Filtrar opciones según reglas de negocio es válido. Mesas usa los códigos `LIBRE` e `INHABILITADA`, porque los otros estados pertenecen al flujo de pedidos. El texto y el valor de esas opciones se obtienen de la API.

Ya consumen este módulo los selectores de disponibilidad de mesas, tipo de estación y tipo de almacén. Otros formularios pueden adoptar el mismo patrón; las reglas de negocio y colores de estados no se convierten en catálogos visuales.

## Base de datos

Antes de utilizar estas vistas, instalar las dos funciones SQL descritas en `api-sistema-inga/docs/listas.md`. No se añadió una pantalla de administración de listas ni se modifican los catálogos desde el frontend.

## Configurar IDs

Consultar `SELECT id, codigo FROM gen_lista ORDER BY id;` (o `GET /general/listas`) y escribir cada ID real en `src/modules/listas/constants/lista-ids.ts`. Las claves como `MESA_ESTADO` son nombres legibles de constantes; su valor es el ID numérico, no un código enviado al backend.

Los 19 IDs están configurados según los datos proporcionados por el usuario: `ALMACEN_TIPO = 1`, `ESTACION_TIPO = 2`, `PRODUCTO_TIPO = 3`, `MESA_ESTADO = 9`, entre otros. El servicio rechaza IDs no enteros o menores que 1 antes de enviar la petición.

El flujo es: `LISTA_IDS.MESA_ESTADO` → `GET /general/listas/:id/opciones` → `gen_lista_opcion.id_lista`. No se resuelve el catálogo por código ni se asignan IDs automáticamente. Al agregar una lista, añadir su nombre e ID real al objeto `LISTA_IDS`; el tipo `NombreLista` se deriva automáticamente.