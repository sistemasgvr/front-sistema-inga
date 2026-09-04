# Lista de Tareas por Módulo — Sistema Inga
> Adaptada al esquema PostgreSQL real (`database.sql`)
> Prefijos: `auth_`, `gen_`, `cli_`, `pro_`, `alm_`, `prod_`, `com_`, `caj_`, `ven_`, `kds_`, `cxc_`

---

## Estado de avance — auditoría del código (03/09/2026)

**Leyenda:** `[x]` implementado · `[~]` parcial (ver nota en cursiva) · `[ ]` pendiente

| Módulo | Backend | Frontend | Estado |
|---|---|---|---|
| M01 — Autenticación y Roles | 7/10 | 4/6 | 🟨 Avanzado (falta refresh, PIN, redirección por rol) |
| M02 — Configuración General | 3/10 | 2/5 | 🟨 Parcial (solo almacenes, estaciones y sucursales) |
| M03 — Productos, Carta y Recetario | 13/16 | 3/7 | 🟨 Backend casi completo, front sin recetario |
| M04 — Menú del Día | 0/7 | 0/4 | 🟥 No iniciado |
| M05 — Salón, Mesas y Pedidos | 0/15 | 0/6 | 🟥 No iniciado |
| M06 — KDS | 0/6 | 0/4 | 🟥 No iniciado |
| M07 — Compras e Ingreso a Almacén | 0/8 | 0/4 | 🟥 No iniciado |
| M08 — Salidas y Requerimientos | 0/9 | 0/5 | 🟥 No iniciado |
| M09 — Producción | 0/6 | 0/4 | 🟥 No iniciado |
| M10 — Stock y Alertas | 0/10 | 0/5 | 🟥 No iniciado |
| M11 — Caja y Turno | 0/8 | 0/5 | 🟥 No iniciado |
| M12 — Cobro y Pagos | 0/9 | 0/5 | 🟥 No iniciado |
| M13 — Facturación Electrónica | 0/10 | 0/5 | 🟥 No iniciado |
| M14 — Cuentas por Cobrar | 0/9 | 0/4 | 🟥 No iniciado |
| M15 — Reportes y Dashboard | 0/8 | 0/8 | 🟥 No iniciado (dashboard con charts demo) |
| Transversales | 3/7 | 2/5 | 🟨 Base técnica lista |

**Resumen ejecutivo:**
- La **base de datos está completamente modelada** (64 tablas + 4 vistas en `database.sql`) para todos los módulos, incluidos los que aún no tienen una sola línea de código.
- Lo construido corresponde a los **módulos de maestros y configuración** (M01, M02 parcial, M03): autenticación JWT con permisos, usuarios, roles, sucursales, almacenes, estaciones, categorías, subcategorías, productos, recetas y adicionales.
- **Nada de la operación del restaurante está implementado todavía**: mesas y pedidos (M05), KDS (M06), caja y cobros (M11/M12), compras y almacén (M07–M10), facturación (M13), créditos (M14) y reportes (M15).
- Arquitectura backend: NestJS + PostgreSQL con **toda la lógica de negocio en funciones SQL** (`database_sql/funciones/`), invocadas por la cadena `controllers → logic → models`. Cualquier módulo nuevo debe seguir ese mismo patrón.
- Arquitectura frontend: Next.js (App Router) + Tailwind, módulos en `src/modules/<modulo>/{components,hooks,services,types}` y cliente HTTP central en `src/shared/api/api-client.ts`.

**Bloqueantes para que el sistema opere como restaurante:**
1. No existe el flujo mesa → pedido → comanda → cocina → cobro. Es el núcleo del negocio y está en cero.
2. `gen_correlativo` no tiene endpoint ni control de concurrencia; sin eso no se puede facturar.
3. No hay canal en tiempo real (WebSocket o polling) para KDS ni alertas de stock.
4. El descuento de stock por receta —el que conecta M03 con M05 y M10— no está escrito en ninguna parte.

---

## M01 — Autenticación y Roles
**Tablas:** `auth_usuario`, `auth_rol`, `auth_permiso`, `auth_rol_permiso`, `auth_usuario_rol`, `auth_sesion`

### Backend
- [~] Endpoint POST `/auth/login` — valida `username`/`email` + `password_hash`, devuelve JWT + refresh token — *implementado en `login.controller.ts`: entrega JWT, `sesionId` y permisos, pero **no emite refresh token***
- [ ] Endpoint POST `/auth/refresh` — valida `refresh_token_hash` en `auth_sesion`, emite nuevo JWT
- [x] Endpoint POST `/auth/logout` — cierra `auth_sesion` (setea `fecha_fin`, `estado = 0`) — *`auth_cerrar_sesion.sql`*
- [ ] Endpoint POST `/auth/login-pin` — login rápido por `pin_hash` para mozos en tablet — *el campo `pin` ya existe en el DTO y en BD; falta el endpoint*
- [x] CRUD `/admin/usuarios` — gestión de `auth_usuario` con asignación de roles en `auth_usuario_rol` — *expuesto como `/auth/usuarios`; roles vía `rolesIds` y `PATCH /auth/roles/usuario/:idUsuario`*
- [x] CRUD `/admin/roles` — gestión de `auth_rol` y permisos en `auth_rol_permiso` — *expuesto como `/auth/roles` + `PATCH /auth/roles/:id/permisos`*
- [x] Middleware de autorización — verifica JWT y consulta `auth_rol_permiso` por módulo/acción — *`JwtAuthGuard` global + `PermisosGuard` + decoradores `@Permisos()` / `@Public()`*
- [~] Validaciones:
  - [x] `username` y `email` únicos (constraint `uq_auth_usuario_username`, `uq_auth_usuario_email`) — *validado también en `auth_crear_usuario.sql`*
  - [ ] `password_hash` mínimo 8 caracteres antes de hashear — *el DTO exige solo 6 (`@MinLength(6)`)*
  - [ ] No desactivar (`estado = 0`) al último usuario con rol `ADMIN`
  - [x] `auth_sesion.fecha_expiracion` configurable por env; rechazar tokens expirados — *`JWT_EXPIRES_IN` + `auth_validar_sesion.sql` filtra `fecha_expiracion > NOW()`*
  - [ ] `pin_hash` solo válido si el usuario tiene rol `MOZO` o `BARMAN`
- [x] **(extra)** Endpoint GET `/auth/me` — usuario autenticado con sus banderas de permiso
- [x] **(extra)** Endpoint GET `/auth/permisos` — catálogo de permisos para la matriz de roles

### Frontend
- [x] Pantalla de login (email + contraseña) — *`(auth)/login` + `modules/auth/components/login-form.tsx`*
- [ ] Teclado PIN numérico para mozos (login rápido en tablet)
- [ ] Redirección por rol: ADMIN → dashboard, MOZO → mesas, CHEF → KDS, CAJERO → caja, BARMAN → barra — *hoy todos los roles van a `/dashboard`*
- [x] Pantalla de gestión de usuarios y roles (solo ADMIN): crear, editar, activar/desactivar, asignar rol — *`/users` y `/roles` con modal de permisos*
- [x] Cierre de sesión con limpieza de token local — *`auth.service.ts` limpia `localStorage` y `sessionStorage`*
- [~] Interceptor HTTP: adjuntar JWT en cada request; si 401 → intentar refresh; si falla → logout — *`shared/api/api-client.ts` adjunta el JWT y hace logout en 401; **no intenta refresh***
- [x] **(extra)** `RequireAuth` + `RoleGuard` para proteger rutas por permiso

---

## M02 — Configuración General
**Tablas:** `gen_empresa`, `gen_sucursal`, `gen_almacen`, `gen_estacion`, `gen_correlativo`, `gen_lista`, `gen_lista_opcion`, `gen_condicion_pago`, `gen_configuracion_sunat`

### Backend
- [ ] Endpoint GET/PUT `/config/empresa` — datos de `gen_empresa` (RUC, razón social, dirección)
- [x] Endpoint CRUD `/config/almacenes` — gestión de `gen_almacen` con `tipo_almacen` (CRUDO / PRODUCCION_COCINA / PRODUCCION_BARRA) — *expuesto como `/almacenes`*
- [x] Endpoint CRUD `/config/estaciones` — gestión de `gen_estacion` (nombre impresora, IP, tipo COCINA/BARRA/CAJA, `usa_kds`) — *expuesto como `/estaciones`*
- [ ] Endpoint GET/PUT `/config/correlativos` — administración de series en `gen_correlativo` por tipo de documento
- [ ] Endpoint GET `/config/listas` — exponer `gen_lista` + `gen_lista_opcion` para los selectores del frontend — *hoy los selectores del front usan valores hardcodeados*
- [ ] Endpoint CRUD `/config/sunat` — guardar credenciales cifradas en `gen_configuracion_sunat`
- [~] Validaciones:
  - [ ] RUC de empresa: 11 dígitos numéricos
  - [ ] `gen_correlativo`: no puede haber dos series activas del mismo `tipo_documento` por sucursal
  - [x] `gen_almacen`: no eliminar almacén con stock > 0 — *`gen_eliminar_almacen.sql`*
  - [ ] `gen_estacion`: IP de impresora con formato válido si se indica — *solo valida nombre, código único por sucursal y sucursal activa*
- [x] **(extra)** CRUD `/general/sucursales` — gestión de `gen_sucursal`

### Frontend
- [ ] Formulario de datos de empresa (RUC, nombre, dirección)
- [x] Pantalla de almacenes: tipo (crudo / cocina / barra), nombre, estado — *`/almacenes`*
- [x] Pantalla de estaciones: tipo, nombre impresora, IP, toggle KDS — *`/estaciones`*
- [ ] Pantalla de series/correlativos por tipo de comprobante
- [ ] Pantalla de credenciales SUNAT (campos enmascarados)
- [~] **(extra)** Pantalla de sucursales — *módulo `modules/sucursales` completo (tabla, modal, hook, service) pero **sin ruta en `src/app`**; hoy solo se usa como selector en el alta de usuarios*

---

## M03 — Productos, Carta y Recetario
**Tablas:** `pro_categoria`, `pro_subcategoria`, `pro_producto`, `pro_unidad_medida`, `pro_unidad_conversion`, `pro_receta`, `pro_receta_insumo`, `pro_adicional`

### Backend
- [x] CRUD `/productos/categorias` — gestión de `pro_categoria` con campo `es_carta` y `orden`
- [x] CRUD `/productos/subcategorias` — gestión de `pro_subcategoria` anidada a categoría
- [x] CRUD `/productos` — gestión de `pro_producto` con `tipo_producto` (INSUMO_CRUDO, INSUMO_PROCESADO, PLATO_CARTA, PLATO_MENU, TRAGO, BEBIDA_UNITARIA, ADICIONAL)
- [x] CRUD `/productos/{id}/recetas` — gestión de `pro_receta` con versionado; solo una `vigente = TRUE` por producto — *`pro_crear_receta.sql` calcula la siguiente versión y apaga la anterior*
- [x] CRUD `/productos/{id}/recetas/{id}/insumos` — líneas de `pro_receta_insumo` con cantidad, unidad, `porcentaje_merma`, `grupo_sustitucion` — *`POST /productos/recetas/:idReceta/insumos` (upsert) + `DELETE`; incluye `es_opcional`*
- [x] CRUD `/productos/{id}/adicionales` — gestión de `pro_adicional`
- [x] Endpoint GET `/productos/unidades` — listado de `pro_unidad_medida` y conversiones `pro_unidad_conversion` — *`pro_listar_unidades_medida.sql` devuelve `{ unidades, conversiones }`*
- [x] Endpoint PUT `/productos/{id}/disponibilidad` — toggle `disponible_venta` en `pro_producto`
- [x] Endpoint GET `/productos/insumos-procesados` — filtra `tipo_producto IN (2)` para el buscador de recetas
- [~] Validaciones:
  - [x] `codigo_interno` único (constraint `uq_pro_producto_codigo`) — *validado además en `pro_crear_producto.sql`*
  - [~] Receta: `cantidad > 0` (constraint `ck_receta_insumo_cant`); insumo solo tipo `INSUMO_PROCESADO` — *valida `cantidad > 0` y que el insumo exista; **no valida que sea tipo 2***
  - [x] Al versionar receta: desactivar la anterior (`vigente = FALSE`) antes de crear la nueva
  - [ ] `pro_producto.controla_stock = TRUE` solo para tipos INSUMO_CRUDO, INSUMO_PROCESADO, BEBIDA_UNITARIA
  - [ ] Platos/tragos con `controla_stock = FALSE` (el stock se controla por receta)
  - [x] `id_estacion` obligatorio en platos, tragos y bebidas (define a dónde va la comanda) — *valida tipos 3, 4, 5 y 6*
  - [x] `id_almacen_stock` obligatorio si `controla_stock = TRUE`

### Frontend
- [~] Árbol de categorías y subcategorías con orden drag-and-drop — *hay dos pantallas separadas (`/productos/categorias` y `/productos/subcategorias`) con campo `orden` numérico manual; **sin árbol ni drag-and-drop***
- [x] Formulario de producto con selector de tipo, categoría, unidad de medida, estación destino — *`producto-form-modal.tsx`*
- [x] Toggle `disponible_venta` desde el listado de productos — *badge "En Carta / Agotado" en `productos-table.tsx`*
- [ ] Constructor de receta: buscador de insumos procesados, campo cantidad, unidad, % merma, opcionales y grupos de sustitución — *el backend está listo, no hay UI*
- [ ] Historial de versiones de receta (solo lectura de versiones anteriores)
- [ ] Gestión de adicionales por producto — *el backend está listo, no hay UI*
- [~] Validaciones: código único, cantidad > 0, insumo no puede ser un plato/trago — *el front muestra el error que devuelve la API; sin validación previa en el formulario*

---

## M04 — Menú del Día
**Tablas:** `ven_menu_dia`, `ven_menu_dia_item`
> 🟥 **No iniciado.** Las tablas existen en `database.sql`; no hay módulo backend ni pantallas.

### Backend
- [ ] Endpoint POST `/menu-dia` — crea cabecera en `ven_menu_dia` (fecha, tipo_menu, sucursal)
- [ ] Endpoint PUT `/menu-dia/{id}/items` — agrega/edita/elimina ítems en `ven_menu_dia_item` (producto, precio, porciones, orden, activo)
- [ ] Endpoint GET `/menu-dia/hoy` — devuelve el menú activo del día actual
- [ ] Endpoint GET `/menu-dia/{id}/exportar` — genera PDF o Word con los platos del día
- [ ] Validaciones:
  - [ ] Solo un menú activo por `(id_sucursal, fecha, tipo_menu)` (constraint `uq_ven_menu_dia`)
  - [ ] `precio_venta` en ítem debe ser > 0
  - [ ] `porciones_disponibles` debe ser >= 0 si se controla

### Frontend
- [ ] Pantalla de menú del día: selector de fecha, lista de platos disponibles del catálogo
- [ ] Agregar/quitar platos del menú, editar precio y porciones disponibles, reordenar
- [ ] Toggle `activo` por ítem para activar/desactivar en tiempo real
- [ ] Botón exportar PDF/Word del menú del día

---

## M05 — Salón, Mesas y Pedidos
**Tablas:** `ven_salon`, `ven_mesa`, `ven_pedido`, `ven_pedido_detalle`, `ven_pedido_detalle_adicional`, `ven_comanda`
> 🟥 **No iniciado — módulo crítico.** Es el núcleo de la operación del restaurante: no existe ni backend ni frontend.

### Backend
- [ ] CRUD `/salon/salones` — gestión de `ven_salon` (zonas del local)
- [ ] CRUD `/salon/mesas` — gestión de `ven_mesa` con `estado_mesa` (LIBRE/OCUPADA/POR_COBRAR/INHABILITADA) y `capacidad_personas`
- [ ] Endpoint POST `/pedidos` — abre `ven_pedido` con `tipo_pedido`, `id_mesa`, `id_mozo`, `id_turno`; cambia mesa a OCUPADA
- [ ] Endpoint POST `/pedidos/{id}/items` — agrega líneas a `ven_pedido_detalle` con `id_producto`, `id_receta`, cantidad, precio, adicionales en `ven_pedido_detalle_adicional`
- [ ] Endpoint PUT `/pedidos/{id}/items/{item_id}` — edita cantidad/observación antes de enviar comanda
- [ ] Endpoint DELETE `/pedidos/{id}/items/{item_id}` — anula línea (`tipo_linea = 3`) solo si `stock_descontado = FALSE`
- [ ] Endpoint POST `/pedidos/{id}/comandar` — crea `ven_comanda` por estación, cambia `estado_pedido = 2`, descuenta stock por receta en `alm_producto_stock` + registra en `alm_kardex` (tipo VENTA, signo -1), setea `stock_descontado = TRUE`
- [ ] Endpoint PUT `/pedidos/{id}/estado` — transiciones válidas: ABIERTO → COMANDADO → POR_COBRAR → PAGADO / ANULADO
- [ ] Endpoint POST `/pedidos/{id}/anular` — anula pedido, reversa stock (`ANULACION_VENTA`, signo +1), cambia mesa a LIBRE
- [ ] Validaciones:
  - [ ] No abrir pedido en mesa con `estado_mesa != 1` (LIBRE)
  - [ ] No comandar pedido sin ítems
  - [ ] No eliminar ítem con `stock_descontado = TRUE`
  - [ ] `cantidad > 0` (constraint `ck_pedido_det_cant`)
  - [ ] Anulación requiere `id_usuario_autoriza` con rol ADMIN o CAJERO
  - [ ] Recalcular `monto_subtotal`, `monto_igv`, `monto_total` en `ven_pedido` en cada cambio

### Frontend
- [ ] Mapa de salón con mesas por zona, estado con color (libre/ocupada/por cobrar/inhabilitada)
- [ ] Pantalla de pedido: carta agrupada por categoría/subcategoría, buscador de platos
- [ ] Carrito: ítems con cantidad, precio, observación, adicionales seleccionables
- [ ] Botón "Comandar" con confirmación — envía a cocina/barra/caja según estación del producto
- [ ] Anulación de ítem o pedido completo con campo de motivo y autorización
- [ ] Vista precuenta: resumen del pedido antes de cobrar

---

## M06 — KDS (Pantalla de Cocina / Barra)
**Tablas:** `kds_ticket`, `ven_comanda`, `ven_pedido_detalle`
> 🟥 **No iniciado.** Depende de M05. La tabla `kds_ticket` y el flag `gen_estacion.usa_kds` ya existen y el front ya permite marcar qué estación usa KDS.

### Backend
- [ ] Endpoint GET `/kds/{id_estacion}/tickets` — lista `kds_ticket` activos por estación con `estado_kds` (PENDIENTE/EN_PREP/LISTO)
- [ ] Endpoint PUT `/kds/tickets/{id}/estado` — actualiza `estado_kds`, registra `fecha_inicio` y `fecha_listo`
- [ ] Lógica de alerta de tiempo: si `tiempo_prep_min` superado → `alerta_tiempo = TRUE`
- [ ] Endpoint WebSocket o polling `/kds/{id_estacion}/live` — push de nuevos tickets al KDS
- [ ] Validaciones:
  - [ ] Transiciones válidas: PENDIENTE → EN_PREP → LISTO → ENTREGADO
  - [ ] Solo la estación correspondiente puede actualizar su ticket

### Frontend (vista KDS — pantalla dedicada)
- [ ] Pantalla KDS por estación: columnas por estado (pendiente / en prep / listo)
- [ ] Tarjeta por ticket: mesa, plato, cantidad, observación, tiempo transcurrido
- [ ] Alerta visual si supera tiempo de preparación
- [ ] Botón de cambio de estado con un toque

---

## M07 — Compras e Ingreso a Almacén
**Tablas:** `com_compra`, `com_compra_detalle`, `alm_producto_stock`, `alm_kardex`
> 🟥 **No iniciado.** Falta además el CRUD de `cli_persona` (proveedores), que no figura en ninguna tarea y es requisito de este módulo.

### Backend
- [ ] Endpoint POST `/compras` — registra `com_compra` con proveedor (`cli_persona` con `es_proveedor = TRUE`), almacén destino (tipo CRUDO), condición de pago, comprobante del proveedor
- [ ] Endpoint POST `/compras/{id}/detalle` — líneas de `com_compra_detalle`: producto, cantidad, unidad de compra, `cantidad_base` (convertida a UM de stock usando `pro_unidad_conversion`), costo unitario
- [ ] Endpoint POST `/compras/{id}/confirmar` — si `se_ingresa_kardex = TRUE`: suma stock en `alm_producto_stock` + inserta en `alm_kardex` (tipo COMPRA, signo +1); avanza `gen_correlativo`
- [ ] Endpoint GET `/compras` — historial de compras con filtros (fecha, proveedor, almacén)
- [ ] Validaciones:
  - [ ] Proveedor debe tener `es_proveedor = TRUE`
  - [ ] `cantidad > 0` y `costo_unitario > 0`
  - [ ] Si la unidad de compra difiere de la UM de stock, debe existir conversión en `pro_unidad_conversion`
  - [ ] No confirmar compra sin al menos una línea

### Frontend
- [ ] Formulario de nueva compra: buscador de proveedor, almacén destino, condición de pago, comprobante
- [ ] Líneas de compra: buscador de producto (tipo INSUMO_CRUDO), cantidad, unidad compra → muestra `cantidad_base` calculada automáticamente
- [ ] Botón confirmar con resumen antes de ingresar al kardex
- [ ] Historial de compras con filtros y detalle expandible

---

## M08 — Salidas de Almacén y Requerimientos
**Tablas:** `prod_requerimiento`, `prod_requerimiento_detalle`, `alm_salida`, `alm_salida_detalle`, `alm_salida_evidencia`, `alm_kardex`
> 🟥 **No iniciado.**

### Backend
- [ ] Endpoint POST `/requerimientos` — crea `prod_requerimiento` (chef solicita crudo: 8 patos, arroz, etc.)
- [ ] Endpoint POST `/requerimientos/{id}/detalle` — líneas de `prod_requerimiento_detalle` (producto crudo, cantidad, unidad, nota)
- [ ] Endpoint PUT `/requerimientos/{id}/estado` — transición: SOLICITADO → ATENDIDO → PRODUCIDO
- [ ] Endpoint POST `/almacen/salidas` — crea `alm_salida` vinculada opcionalmente a `id_requerimiento`, con `destino` (COCINA/BARRA)
- [ ] Endpoint POST `/almacen/salidas/{id}/detalle` — líneas de `alm_salida_detalle`; descuenta `alm_producto_stock` + kardex (tipo SALIDA_ALMACEN, signo -1)
- [ ] Endpoint POST `/almacen/salidas/{id}/evidencia` — sube URL de foto en `alm_salida_evidencia` (reemplaza la foto de WhatsApp)
- [ ] Validaciones:
  - [ ] Cantidad de salida no puede superar `stock_actual` en `alm_producto_stock` (constraint `ck_alm_stock_no_neg`)
  - [ ] `destino` obligatorio en `alm_salida`
  - [ ] Solo productos tipo INSUMO_CRUDO pueden salir del almacén crudo

### Frontend
- [ ] Formulario de requerimiento: buscador de producto crudo, cantidad, unidad, nota de peso
- [ ] Listado de requerimientos por estado con botón de atender
- [ ] Formulario de salida de almacén: selector de requerimiento (opcional), destino, líneas de productos
- [ ] Carga de foto de evidencia por salida
- [ ] Historial de salidas con filtro por fecha, destino y producto

---

## M09 — Producción (Ingreso al Recetario)
**Tablas:** `prod_orden`, `prod_orden_detalle`, `alm_producto_stock`, `alm_kardex`
> 🟥 **No iniciado.**

### Backend
- [ ] Endpoint POST `/produccion/ordenes` — crea `prod_orden` con `tipo_produccion` (COCINA/BARRA), almacén destino (PRODUCCION_COCINA o PRODUCCION_BARRA), vinculado opcionalmente a `id_requerimiento`
- [ ] Endpoint POST `/produccion/ordenes/{id}/detalle` — líneas de `prod_orden_detalle`: insumo procesado, cantidad, unidad, `nota_rendimiento` (texto libre: "De 8 patos enteros → 45 presas")
- [ ] Endpoint POST `/produccion/ordenes/{id}/confirmar` — suma stock en `alm_producto_stock` del almacén producción + kardex (tipo PRODUCCION, signo +1); verifica alerta (`stock_actual <= stock_minimo` → inserta `alm_alerta`)
- [ ] Validaciones:
  - [ ] Solo productos tipo INSUMO_PROCESADO pueden ingresar a almacén de producción
  - [ ] `cantidad > 0`
  - [ ] Almacén destino debe ser tipo PRODUCCION_COCINA o PRODUCCION_BARRA

### Frontend
- [ ] Formulario de orden de producción: tipo (cocina/barra), referencia a requerimiento
- [ ] Líneas: buscador de insumo procesado, cantidad, unidad, nota de rendimiento
- [ ] Botón confirmar con resumen del ingreso al stock
- [ ] Historial de órdenes con filtro por fecha y tipo

---

## M10 — Stock y Alertas
**Tablas:** `alm_producto_stock`, `alm_kardex`, `alm_alerta`, `alm_traslado`, `alm_ajuste`
**Vistas:** `vw_stock_alerta`
> 🟥 **No iniciado.** La vista `vw_stock_alerta` ya está creada en `database.sql`.

### Backend
- [ ] Endpoint GET `/stock` — consulta `alm_producto_stock` por almacén con datos de producto y unidad; soporta filtro por `tipo_almacen` y `alerta_activa`
- [ ] Endpoint GET `/stock/alertas` — usa `vw_stock_alerta` (stock_actual <= stock_minimo); marca `vista_chef` / `vista_admin` en `alm_alerta`
- [ ] Endpoint PUT `/stock/{almacen}/{producto}/minimo` — configura `stock_minimo` en `alm_producto_stock`
- [ ] Endpoint GET `/stock/kardex/{id_producto}` — historial `alm_kardex` con filtro por almacén y fechas
- [ ] Endpoint POST `/stock/traslados` — crea `alm_traslado` + detalles; descuenta origen y suma destino en `alm_producto_stock` + kardex (TRASLADO_SALIDA / TRASLADO_ENTRADA)
- [ ] Endpoint POST `/stock/ajustes` — crea `alm_ajuste` + detalles (`stock_sistema` vs `stock_contado`); aplica diferencia en kardex (AJUSTE_MAS o AJUSTE_MENOS)
- [ ] Validaciones:
  - [ ] `ck_alm_stock_no_neg`: stock nunca negativo
  - [ ] Traslado: almacenes origen y destino distintos (constraint `ck_traslado_distintos`)
  - [ ] Ajuste: solo ADMIN puede confirmar
  - [ ] Alerta: no duplicar alerta activa para mismo producto/almacén dentro del mismo día

### Frontend
- [ ] Tabla de stock actual por almacén: producto, stock, mínimo, estado (OK / ⚠ bajo)
- [ ] Panel de alertas de stock con confirmación de visto (chef y admin por separado)
- [ ] Formulario de traslado entre almacenes
- [ ] Formulario de ajuste de inventario: ingresar conteo real, el sistema calcula la diferencia
- [ ] Historial de kardex por producto con filtro por tipo de movimiento y fecha

---

## M11 — Caja y Turno
**Tablas:** `caj_caja`, `caj_turno`, `caj_arqueo_detalle`, `caj_movimiento`
> 🟥 **No iniciado.** Falta también el CRUD de `caj_caja` (alta de cajas por sucursal), previo a los turnos.

### Backend
- [ ] Endpoint POST `/caja/turnos/abrir` — crea `caj_turno` con `monto_apertura`; solo un turno abierto por caja (index `uq_caj_turno_abierto`)
- [ ] Endpoint POST `/caja/turnos/{id}/cerrar` — registra `monto_cierre_declarado`, calcula `monto_diferencia` vs `monto_cierre_sistema`, cierra turno
- [ ] Endpoint POST `/caja/turnos/{id}/arqueo` — líneas de `caj_arqueo_detalle` (denominación × cantidad)
- [ ] Endpoint POST `/caja/turnos/{id}/movimientos` — ingresos/egresos de caja en `caj_movimiento` (gastos, retiros)
- [ ] Endpoint GET `/caja/turnos/{id}/resumen` — total por medio de pago, movimientos, diferencia de arqueo
- [ ] Validaciones:
  - [ ] No abrir turno si ya hay uno abierto en la misma caja
  - [ ] `monto > 0` en movimientos (constraint `ck_caj_mov_monto`)
  - [ ] Solo CAJERO o ADMIN pueden abrir/cerrar turno

### Frontend
- [ ] Pantalla de apertura de turno con monto inicial
- [ ] Panel de turno activo: ventas acumuladas por medio de pago
- [ ] Formulario de ingreso/egreso de caja con motivo
- [ ] Formulario de arqueo: tabla de denominaciones con conteo
- [ ] Pantalla de cierre con resumen y diferencia

---

## M12 — Cobro y Pagos
**Tablas:** `ven_pago`, `ven_pedido`, `cli_persona`, `cli_convenio`
> 🟥 **No iniciado.** Depende de M05 (pedidos) y M11 (turno de caja).

### Backend
- [ ] Endpoint POST `/cobros` — registra `ven_pago` con `id_pedido`, `id_turno`, `medio_pago`, `monto`, `monto_recibido`, `vuelto`
- [ ] Soporte pago mixto: múltiples `ven_pago` por pedido hasta cubrir `monto_total`
- [ ] Si `medio_pago = 4` (CREDITO): requiere `id_persona` + `id_convenio`; crea movimiento en `cxc_movimiento` (tipo 1 = cargo)
- [ ] Endpoint para calcular vuelto: `vuelto = monto_recibido - monto`
- [ ] Al completar pago: cambia `ven_pedido.estado_pedido = 4` (PAGADO), `ven_mesa.estado_mesa = 1` (LIBRE), actualiza `monto_pagado`
- [ ] Validaciones:
  - [ ] `monto_pagado` acumulado no puede superar `monto_total` del pedido
  - [ ] Para crédito: `id_persona` con `es_cliente = TRUE` y `id_convenio` activo
  - [ ] No cerrar pedido si `monto_pagado < monto_total`
  - [ ] Turno de caja debe estar abierto (`estado_turno = 1`)

### Frontend
- [ ] Pantalla de cobro: resumen del pedido, selector de medio de pago
- [ ] Soporte pago mixto: agregar múltiples pagos parciales
- [ ] Flujo crédito: buscador de persona (`cli_persona`) por nombre o documento, validación de convenio
- [ ] Cálculo de vuelto en tiempo real para efectivo
- [ ] Confirmación final antes de cerrar el pedido

---

## M13 — Facturación Electrónica
**Tablas:** `ven_comprobante`, `ven_comprobante_detalle`, `gen_configuracion_sunat`, `gen_correlativo`
> 🟥 **No iniciado.** Bloqueado por M02 (correlativos + credenciales SUNAT) y M12 (cobro).

### Backend
- [ ] Endpoint POST `/comprobantes` — emite `ven_comprobante` (boleta/factura/nota de venta) vinculado a `ven_pedido`; usa `gen_correlativo` para serie y número
- [ ] Lógica de emisión: construir XML, llamar API del proveedor OSE, guardar `ruta_pdf`, `ruta_xml`, `hash_qr`, actualizar `estado_sunat`
- [ ] Endpoint POST `/comprobantes/{id}/reenviar` — reintento si `estado_sunat = 3` (RECHAZADO) o fallo de red
- [ ] Endpoint POST `/comprobantes/{id}/nota-credito` — anula comprobante emitiendo nota de crédito (`tipo_comprobante = 4`), vinculada por `id_comprobante_origen`
- [ ] Endpoint POST `/comprobantes/{id}/imprimir` — envía orden de impresión a impresora de caja (`gen_estacion` tipo CAJA)
- [ ] Validaciones:
  - [ ] Para boleta: `receptor_num_doc` DNI 8 dígitos (opcional)
  - [ ] Para factura: `receptor_num_doc` RUC 11 dígitos (obligatorio), `tipo_persona = 2` (jurídica)
  - [ ] Correlativo: incremento atómico en `gen_correlativo.ultimo_numero` para evitar duplicados
  - [ ] No emitir comprobante si el pedido no está en estado PAGADO
  - [ ] `estado_sunat` registra respuesta real: PENDIENTE → ACEPTADO / RECHAZADO

### Frontend
- [ ] Modal post-cobro: selección boleta / factura / nota de venta
- [ ] Campo DNI (opcional en boleta) o RUC + razón social (obligatorio en factura)
- [ ] Confirmación con número de comprobante generado y estado SUNAT
- [ ] Botón reimprimir comprobante
- [ ] Mensaje de error con detalle si el proveedor rechaza

---

## M14 — Cuentas por Cobrar (Crédito Consorcio)
**Tablas:** `cxc_movimiento`, `cli_convenio`, `cli_persona`
**Vistas:** `vw_cxc_saldo_persona`
> 🟥 **No iniciado.** La vista `vw_cxc_saldo_persona` ya está creada en `database.sql`.

### Backend
- [ ] Endpoint GET `/cxc/saldos` — usa `vw_cxc_saldo_persona`; filtra por convenio, persona, período
- [ ] Endpoint GET `/cxc/movimientos` — historial de `cxc_movimiento` con filtros: `id_persona`, `anio`, `mes`, `quincena`
- [ ] Endpoint POST `/cxc/abonos` — registra abono en `cxc_movimiento` (tipo 2), actualiza `saldo_resultante`
- [ ] Endpoint GET `/cxc/reporte-quincena` — totales de consumo y saldo por persona/convenio en la quincena indicada
- [ ] CRUD `/cxc/convenios` — gestión de `cli_convenio` (GVR, 4G, ApuSalud, Jurisconta) con `limite_credito` y `corte_quincenal`
- [ ] Validaciones:
  - [ ] `tipo_movimiento IN (1, 2, 3)` (constraint `ck_cxc_tipo`)
  - [ ] `mes BETWEEN 1 AND 12`, `quincena IN (1, 2)` (constraints de la tabla)
  - [ ] Abono no puede superar el saldo deudor de la persona
  - [ ] `saldo_resultante` calculado en el backend, no ingresado manualmente

### Frontend
- [ ] Listado de saldos por persona con filtro por convenio y período (mes / quincena)
- [ ] Vista detalle de movimientos por persona: cargos (consumos) y abonos
- [ ] Formulario de abono con monto y observación
- [ ] Reporte de quincena exportable a PDF o Excel por convenio

---

## M15 — Reportes y Dashboard
**Vistas:** `vw_ventas_por_medio`, `vw_platos_rotacion`, `vw_stock_alerta`, `vw_cxc_saldo_persona`
> 🟥 **No iniciado.** Las 4 vistas existen en `database.sql`. El `/dashboard` actual muestra los charts de demo de la plantilla, sin datos reales.

### Backend
- [ ] Endpoint GET `/reportes/ventas-por-medio` — usa `vw_ventas_por_medio`; filtra por rango de fechas; agrupa por día/semana/mes
- [ ] Endpoint GET `/reportes/platos-rotacion` — usa `vw_platos_rotacion`; top N más vendidos y menos vendidos; filtra por tipo_producto y período
- [ ] Endpoint GET `/reportes/stock-actual` — stock consolidado por almacén y tipo (crudo + producción)
- [ ] Endpoint GET `/reportes/kardex` — movimientos de `alm_kardex` con filtros (producto, almacén, tipo_movimiento, fechas)
- [ ] Endpoint GET `/reportes/cxc` — resumen de `cxc_movimiento` por convenio y período
- [ ] Endpoint GET `/reportes/turno/{id}` — resumen del turno: ventas por medio de pago, movimientos de caja, diferencia de arqueo
- [ ] Validaciones:
  - [ ] Rango de fechas obligatorio; fecha inicio <= fecha fin
  - [ ] Paginación en endpoints con volumen alto (kardex, movimientos)

### Frontend
- [ ] Dashboard: tarjetas resumen (ventas del día, alertas activas, créditos pendientes, turno actual) — *hoy solo muestra saludo + charts de demo*
- [ ] Gráfico de ventas por medio de pago (barras apiladas o línea, selector de período)
- [ ] Gráfico de platos más y menos vendidos (barras horizontales)
- [ ] Tabla de stock actual con filtro por almacén y estado de alerta
- [ ] Tabla de kardex con filtros
- [ ] Tabla de CxC con totales por convenio
- [ ] Resumen de turno al cierre
- [ ] Botón exportar a PDF o Excel en todos los reportes

---

## Tareas Transversales

### Backend
- [~] Función `fn_set_fecha_modificacion` ya en el esquema — verificar que todos los triggers se aplican correctamente al migrar — *definida en `database.sql`; falta la verificación explícita tras la migración*
- [x] Manejo global de errores: respuestas estandarizadas `{ codigo, mensaje, detalle }` — *`HttpExceptionFilter` + `TransformResponseInterceptor` + `ApiResponseDto`, con el formato `{ success, message, data, meta, errors }`*
- [~] Logging de operaciones críticas (ventas, kardex, pagos, comprobantes, CxC) — *existe `httpRequestLoggerMiddleware` para requests; **sin logging de negocio** (esos módulos aún no existen)*
- [~] Variables de entorno: credenciales DB, JWT secret, API proveedor SUNAT, clave de cifrado SUNAT — *`env.validation.ts` valida DB y JWT; **faltan las de SUNAT y la clave de cifrado***
- [~] Semilla inicial: ejecutar los `INSERT` del SQL (listas, unidades, conversiones, roles, convenios, país) — *`database.sql` trae los INSERT base y existe `seeds/auth_permisos.sql`; falta consolidar un script de seed único y ejecutable*
- [x] Documentación de endpoints (Swagger / Postman collection) — *Swagger en `/api/docs` con `addBearerAuth`*
- [ ] Control de concurrencia en `gen_correlativo` (SELECT FOR UPDATE o función atómica)
- [x] **(extra)** Patrón de arquitectura definido y aplicado: `controllers → logic → models → funciones SQL`, con helpers de mapeo de respuesta reutilizables

### Frontend
- [~] Diseño responsive orientado a tablets (uso principal en salón y cocina) — *el layout base de la plantilla es responsive, pero las vistas críticas de tablet (salón, KDS, POS) todavía no existen*
- [x] Manejo global de estados de carga y error con feedback visual — *hooks por módulo con `loading`/`error` + `Alert` y `ConfirmDialog`*
- [x] Notificaciones toast para confirmaciones, errores y alertas de stock — *`ToastProvider` montado en `app/layout.tsx`*
- [ ] Polling o WebSocket para alertas de stock y tickets KDS en tiempo real
- [ ] Mensaje claro si se pierde la conexión (modo offline básico o banner de error)

---

## Próximos pasos sugeridos (orden recomendado)

1. **Cerrar M02** — `gen_empresa`, `gen_correlativo` (con bloqueo atómico) y `gen_lista` / `gen_lista_opcion`. Las listas eliminan los valores hardcodeados que hoy tienen los selectores del front.
2. **CRUD de `cli_persona` y `cli_convenio`** — no está listado en ningún módulo, pero es prerrequisito de M07 (proveedores), M12 (crédito) y M14 (CxC).
3. **M05 — Salón, mesas y pedidos** — es el núcleo del negocio; habilita M06, M12 y M13.
4. **M10 — Stock y kardex** — necesario antes de comandar, porque `POST /pedidos/{id}/comandar` descuenta stock por receta.
5. **M11 + M12 + M13** — caja, cobro y comprobante, en ese orden.
6. **M06 (KDS)** junto con el canal en tiempo real (WebSocket), que también sirve a las alertas de stock.
7. **M15 (Reportes)** al final, sobre las vistas ya creadas.

### Deudas técnicas detectadas en lo ya construido

**Pendientes (bloqueantes primero):**
- **Faltan 36 de los 48 permisos en el seed.** `seeds/auth_permisos.sql` solo inserta los de usuarios y roles. Como los de productos, categorías, almacenes, estaciones y sucursales no existen en `auth_permiso`, no se pueden asignar a ningún rol y **esos módulos devuelven 403 a todo usuario que no sea super admin**.
- **`GET /productos/insumos-procesados` está roto por choque de rutas.** `ProductosController.@Get(':id')` se registra antes (`ProductosModule` va antes que `RecetasProductoModule` en `app.module.ts`), así que la URL entra por `/productos/:id`, el `ParseIntPipe` falla y devuelve 400.
- **Dos convenciones de nombres de banderas mezcladas**: `usuarios.listar` (minúscula con punto) vs `ALMACENES_LISTAR` (mayúscula con guion bajo). Unificar a una sola.
- **Subcategorías usa las banderas de categorías**; las `SUBCATEGORIAS_*` están definidas pero nunca se usan.
- **Recetas y adicionales no tienen banderas propias** (reutilizan `PRODUCTOS_VER` / `PRODUCTOS_EDITAR`); borrar una receta solo exige "editar producto".
- **`PermisosGuard` es código muerto** (nunca se registra; la lógica real vive en `JwtAuthGuard`) y **tiene 4 `console.log`** que imprimen el usuario en consola.
- **En el front solo `/users` tiene `RoleGuard`**; las otras 8 páginas no tienen protección, y el ítem "Productos" del sidebar no declara `permission`.
- **`verifyAccess()` no se usa** y, tal como está, cierra la sesión completa en vez de negar solo esa pantalla.
- **`RoleGuard` renderiza y luego redirige** (parpadeo de contenido protegido) y lee los permisos de `localStorage`, así que un permiso revocado sigue vigente hasta el próximo login.
- No hay refresh token: al expirar el JWT el usuario es deslogueado sin aviso.
- `pro_guardar_receta_insumo` no valida que el insumo sea `tipo_producto = 2` (INSUMO_PROCESADO).
- El módulo de sucursales del front está completo pero sin ruta en `src/app`.
- Recetas y adicionales tienen backend listo sin ninguna pantalla que los consuma.
- Quedan por borrar dos carpetas muertas: `api-sistema-inga/src/modules/usuarios-roles` y `front-sistema-inga/src/services` + `src/lib`.

**Ya corregidas:**
- ~~`password` en `CreateUsuarioDto` exigía 6 caracteres~~ → ahora exige 8 en `CreateUsuarioDto` y `UpdateUsuarioDto`, con la validación equivalente en el formulario del front.
- ~~Los 8 servicios del front leían la respuesta de la API de hasta 5 formas distintas~~ → ahora usan el contrato real (`{ success, message, data, meta }`) vía `apiGetPaginated`, con `resumen` tipado en `ApiMeta`.
