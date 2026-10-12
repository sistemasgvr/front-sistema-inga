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
