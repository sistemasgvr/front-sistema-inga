# Formularios de Mesas

La vista compone componentes; `useMesas` coordina acciones, guardado y mensajes;
`mesas.service` usa el cliente HTTP compartido. Los modales reutilizan `FormModal`,
`Select`, `InputField`, `TextArea`, `Label` y `Alert`.

Para listas generales usar `ListaSelect` y los IDs centralizados:

```tsx
import { ListaSelect, LISTA_IDS } from "@/modules/listas";

<ListaSelect
  idLista={LISTA_IDS.PEDIDO_TIPO}
  defaultValue={tipoPedido}
  onChange={setTipoPedido}
/>
```

La solicitud `GET /general/listas/{id}/opciones` se inicia al abrir el selector.
En el backend, `ListasModule` es el único módulo registrado para esta ruta;
el antiguo `GeneralListasModule` por código no debe registrarse simultáneamente.
Se consume el objeto de lista y su propiedad `opciones`, no un array directo.
Por defecto se envía `valor_entero`; para identificar una opción por su código,
usar `campoValor="codigo"`. Nunca usar el texto visible como identificador.

`useLazyOptions` permite el mismo comportamiento para catálogos de entidades,
como productos o usuarios: `load` se conecta a `Select.onOpen`, con indicadores
de carga y error. Conserva los datos mientras el formulario está montado,
evita solicitudes simultáneas y permite reintentar. Al cerrar el modal se desmonta
su contenido, se cancela la consulta pendiente y se limpia el formulario.

En Mesas, los tipos de pedido usan la lista 7 y los comprobantes la lista 11.
Productos y mozos se solicitan desde sus endpoints al abrir sus respectivos
selectores, con paginación completa. El turno se consulta al abrir el formulario
de pedido porque determina si se puede guardar.

La generación de comprobantes sigue pendiente de integrar con el backend;
cargar sus opciones no implementa la emisión.

## Cambios en selectores de datos

Cada selección de salón consulta nuevamente `GET /salon/mesas?id_salon=...`,
incluyendo todas las páginas. Volver a un salón visitado genera otra petición;
no se reutiliza la lista anterior. Se limpian la mesa y el pedido seleccionados,
se muestra carga y se cancelan/ignoran respuestas de selecciones anteriores.
La regla general para futuras implementaciones está guardada en `AGENTS.md`:
cargar opciones al abrir y volver a consultar datos dependientes al cambiar
la selección son responsabilidades distintas y ambas deben respetarse.
