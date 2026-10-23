# Notificaciones del frontend

`ToastProvider`, instalado en el layout raíz, presenta todos los avisos de operaciones
en una capa flotante mediante un portal a `document.body`. El mismo componente se
usa en el login, las pantallas y los modales. El estilo y la duración se cambian
en `src/components/ui/toast/ToastContext.tsx`.

- Para eventos nuevos: `const { toast } = useToast()` y
  `toast("success", "Guardado", "Los cambios se guardaron correctamente.")`.
- Para módulos que necesitan conservar `feedback` para su lógica: `useFeedback`
  reemplaza `useState` y publica cada nuevo objeto de aviso. No renderizar ese
  mismo feedback en la pantalla ni volver a llamar a `toast` desde un hijo.
- Para errores capturados en formularios: `useErrorNotification("Error al guardar")`
  devuelve una función que recibe el mensaje. Cada nuevo intento puede avisar
  aunque el texto sea el mismo; no es necesario guardar un error local.
- Para errores asíncronos que llegan por props: `ToastNotification` publica el
  mensaje cuando aparece o cambia y no ocupa espacio en la página.

Se muestran hasta tres avisos a la vez. Los demás esperan su turno; su tiempo no
empieza hasta que se muestran. Los errores duran ocho segundos y los demás avisos
cinco. Todos tienen cierre manual. Se agrupan mensajes del mismo tipo y texto
emitidos dentro de un segundo para evitar duplicados entre un hook y su formulario.

`Alert` queda reservado para contenido que debe permanecer visible: instrucciones,
restricciones de crédito, falta de turno, diferencias de caja y validaciones del
formulario. Los errores de un campo siguen junto a ese campo. Las confirmaciones
de acciones conservan su diálogo y los avisos operativos de cocina conservan sus
acciones de resolución; no son mensajes temporales de resultado.

## Centro de notificaciones (campana)

`NotificacionesProvider` (en `src/app/(dashboard)/layout.tsx`) mantiene la lista y
el contador; `CampanaNotificaciones` la presenta en el header.

- **Canales**: el servidor asigna al socket todos los canales que el usuario puede
  ver según sus permisos (`pedidos`, `cocina`, `caja`, `inventario`, `ventas`,
  `planilla`, `cuentas-por-pagar`, `cuentas-por-cobrar`, `gastos`,
  `gastos-diarios`, `sistema`). El cliente no envía una lista propia.
- **Contador**: viene de `GET /notificaciones/no-leidas/count`, no de lo cargado.
- **Leídas**: cada ítem tiene un botón para marcarlo como leído sin abrirlo;
  "Marcar todas como leídas" llama a `PATCH /notificaciones/leer-todas`. El
  servidor avisa `notificacion:leidas` a las demás pestañas del usuario.
- **Lista**: filtro Todas / No leídas y paginación con "Cargar más" (20 por página).
  Al reconectar el socket se vuelve a pedir la lista para no perder avisos.
- **Navegación**: la `ruta` de la notificación se abre con `router.push` solo si es
  interna (`esRutaInterna`). Las pantallas de destino leen sus parámetros con
  `<ParametrosRuta>` (`src/components/common/ParametrosRuta.tsx`), que los atiende
  una vez y los quita de la URL:

| Ruta | Acción |
|---|---|
| `/ambientes/mesas?pedido=ID` | abre el pedido |
| `/ventas?venta=ID` | abre el detalle de la venta |
| `/productos/cocina?pedido=ID` | resalta los platos del pedido |
| `/productos/stock?estado=alertas&buscar=NOMBRE` | filtra el producto bajo mínimo |
| `/planilla?anio=A&mes=M&quincena=Q` | abre ese período |
| `/caja/turnos?turno=ID` | abre el detalle del turno |
| `/cuentas-por-pagar?proveedor=ID` | abre el estado de cuenta |
| `/cuentas-por-cobrar/clientes/ID` | página del cliente |
