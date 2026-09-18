# Progreso — Sistema Inga

> **Documento maestro de referencia:** [`alcance_completo_sistema_inga.md`](./alcance_completo_sistema_inga.md).
> Ese archivo manda sobre cualquier otro. Este de acá solo mide el avance contra él.
>
> **Última verificación:** 18/09/2026 — contrastado contra el código real, no contra lo que dicen los documentos.
> **Numeración:** uso la del alcance completo (M01–M19). No coincide con la de documentos anteriores.

---

## Cómo leer este documento

**Encargado:**
- **Edgardo** — el practicante. Confirmado por `git log` sobre cada carpeta de módulo.
- **Nosotros** — trabajo hecho en esta máquina, aún sin commitear.
- **Sin asignar** — nadie lo ha tomado.

**Porcentaje:** mide los ítems del checklist del alcance que están realmente en el código.
Un módulo al 100% significa backend + frontend funcionando, no solo la tabla creada.

> ⚠️ **Advertencia sobre los `[x]` del alcance:** ese documento marca como "✅ Ya construido"
> lo que se vio en el demo de la Reunión 2. Varias de esas marcas corresponden a
> requerimientos que **el demo no cubría del todo**. Acá el porcentaje refleja el código.

---

## 1. Tabla general por módulo

| Módulo | Encargado | Avance | Estado |
|---|---|---|---|
| M01 — Autenticación, Roles y Permisos | Edgardo | 71% | 🟨 Falta PIN de mozos y auditoría |
| M02 — Dashboard | Sin asignar | 0% | 🟥 Solo la plantilla con gráficos de demo |
| M03 — Productos, Categorías y Subcategorías | Edgardo | 67% | 🟨 En curso por él ahora |
| M04 — Recetario | Edgardo | 50% | 🟨 Backend listo, sin pantalla |
| M05 — Personas (Clientes y Proveedores) | **Nosotros** | 100% | 🟩 Completo |
| M06 — Convenios | **Nosotros** | 80% | 🟨 Falta alerta de límite de crédito |
| M07 — Cajas y Sucursales | Edgardo + **Nosotros** | 100% | 🟩 Sucursales él, cajas nosotros |
| M08 — Turnos de Caja | **Nosotros** | 70% | 🟨 Faltan 3 ítems nuevos de la Reunión 2 |
| M09 — Salón, Mesas y Pedidos | Sin asignar | 0% | 🟥 Núcleo del negocio, sin empezar |
| M10 — Estaciones e Impresoras | Edgardo | 25% | 🟨 CRUD hecho, falta el ruteo |
| M11 — Inventario y Alertas de Stock | Sin asignar | 0% | 🟥 Solo existe la tabla de stock |
| M12 — Ventas, Cobro y Descuentos | Sin asignar | 0% | 🟥 Incluye tabla de descuentos 🆕 |
| M13 — Cuentas por Cobrar (CxC) 🆕 | **Nosotros** | **90%** | 🟩 Operativo — falta el 15% automático, que depende de M12 |
| M14 — Gastos Diarios Operativos 🆕 | **Nosotros** | **100%** | 🟩 Completo |
| M15 — Cuentas por Pagar (CxP) 🆕 | **Nosotros** | **100%** | 🟩 Completo — M14 ya genera el cargo automático |
| M16 — Gastos Administrativos 🆕 | **Nosotros** | **100%** | 🟩 Completo |
| M17 — Planilla 🆕 | **Nosotros** | **100%** | 🟩 Completo |
| M18 — Facturación Electrónica | Bloqueado | 5% | ⬜ Esperando proveedor OSE |
| M19 — Página Web | Fuera de alcance | — | ⬜ Proyecto aparte |

**Avance global del alcance funcional (M01–M18): ~54%**

---

## 2. Detalle por requerimiento

### M01 — Autenticación, Roles y Permisos · Edgardo · 71%

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | CRUD de usuarios (nombre, correo, contraseña) | ✅ 100% | Edgardo | |
| 2 | CRUD de roles con nombre configurable | ✅ 100% | Edgardo | |
| 3 | Matriz de permisos por módulo × acción | ✅ 100% | Edgardo | Modal agrupado por módulo, bien resuelto |
| 4 | Asignación de uno o más roles por usuario | ✅ 100% | Edgardo | |
| 5 | Edición y eliminación de roles | ✅ 100% | Edgardo | |
| 6 | Login rápido por PIN para mozos | ❌ 0% | Sin asignar | Campo `pin` ya existe en BD y DTO; falta el endpoint |
| 7 | Auditoría de acciones por usuario | ❌ 0% | Sin asignar | Recomendado en el alcance, no pedido en firme |

> 🔴 **Bloqueante real:** faltan **36 de los 48 permisos** en el seed de la BD. Los de
> productos, categorías, almacenes, estaciones y sucursales no existen en `auth_permiso`,
> así que no se pueden asignar a ningún rol y esos módulos devuelven **403** a todo
> usuario que no sea super admin. Los de personas, convenios y caja sí están sembrados.

---

### M02 — Dashboard · Sin asignar · 0%

| # | Requerimiento | Estado | Encargado |
|---|---|---|---|
| 1 | Filtro de período (rango, últimos N días, mes, año) | ❌ 0% | Sin asignar |
| 2 | Filtro por cliente específico | ❌ 0% | Sin asignar |
| 3 | Gráfico de ventas por período | ❌ 0% | Sin asignar |
| 4 | Gráfico de ingresos vs egresos | ❌ 0% | Sin asignar |
| 5 | Top platos más / menos vendidos | ❌ 0% | Sin asignar |
| 6 | Comparativo compras vs ventas | ❌ 0% | Sin asignar |
| 7 | Tarjeta de deudas por cobrar (CxC) | ❌ 0% | Sin asignar |
| 8 | Tarjeta de deudas por pagar (CxP) 🆕 | ❌ 0% | Sin asignar |
| 9 | Indicador de rentabilidad | ❌ 0% | Sin asignar |
| 10 | Gráfico gastos vs planilla (%) | ❌ 0% | Sin asignar |
| 11 | Gráfico insumos vs ventas (%) | ❌ 0% | Sin asignar |
| 12 | Tabla de stock bajo (menor stock primero) | ❌ 0% | Sin asignar |
| 13 | Vista acumulada multi-mes | ❌ 0% | Sin asignar |

> El alcance marca los ítems 1 y 2 como `[x]`, pero en el código la ruta `/dashboard`
> solo tiene un saludo y los gráficos de demo de la plantilla. **Ninguna métrica es real.**
> Este módulo va al final: necesita datos de M09, M12, M14, M15, M16 y M17.

---

### M03 — Productos, Categorías y Subcategorías · Edgardo · 67%

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | CRUD de categorías | ✅ 100% | Edgardo | Con `es_carta` y `orden` |
| 2 | CRUD de subcategorías anidadas | ✅ 100% | Edgardo | |
| 3 | CRUD de productos | ✅ 100% | Edgardo | |
| 4 | Código interno opcional / autogenerado | ⚠️ 50% | Edgardo | Hoy es **obligatorio**; el alcance lo pide opcional |
| 5 | Creación rápida de producto "al vuelo" | ❌ 0% | Sin asignar | Lo necesitan M09 y M14 |
| 6 | Historial de cambios de precio | ❌ 0% | Sin asignar | Requiere tabla nueva |

> 🔨 **Edgardo está trabajando acá ahora mismo.** No tocar.

---

### M04 — Recetario · Edgardo · 50%

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | Recetas versionadas (una vigente por producto) | ✅ 100% | Edgardo | Backend correcto |
| 2 | Insumos con cantidad, unidad, merma, opcionales, sustitución | ✅ 100% | Edgardo | Backend correcto |
| 3 | Pantalla de constructor de receta | ❌ 0% | Sin asignar | Backend listo, sin UI |
| 4 | Historial de versiones de receta | ❌ 0% | Sin asignar | |

> 🐞 **Bug abierto:** `GET /productos/insumos-procesados` devuelve **400**. Choque de
> rutas: `ProductosController.@Get(':id')` se registra antes que `RecetasProductoController`.
> Es justo el buscador que necesita el constructor de recetas. Es código de Edgardo.

---

### M05 — Personas (Clientes y Proveedores) · Nosotros · 100% 🟩

| # | Requerimiento | Estado | Encargado |
|---|---|---|---|
| 1 | CRUD de personas con tipo (natural/empresa) | ✅ 100% | Nosotros |
| 2 | Selector de documento (DNI/CE/RUC) según tipo | ✅ 100% | Nosotros |
| 3 | Flags independientes: es_cliente, es_proveedor | ✅ 100% | Nosotros |
| 4 | Asignación de convenio a la persona | ✅ 100% | Nosotros |
| 5 | Campos opcionales: correo, teléfono, dirección | ✅ 100% | Nosotros |
| 6 | Edición de datos de persona | ✅ 100% | Nosotros |

**Extras construidos más allá del checklist:** buscador rápido (`/personas/buscar`) para los
autocompletar de M12 y M14; saldo de crédito calculado; bloqueo de baja con deuda pendiente.

**Fuera de alcance por decisión:** `cli_persona_direccion` (el alcance dice "preparadas para
delivery futuro") y el selector de distrito (las tablas de UBIGEO están vacías).

---

### M06 — Convenios · Nosotros · 80%

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | CRUD de convenios con código y nombre | ✅ 100% | Nosotros | |
| 2 | Condición de pago: quincenal / 30 días | ✅ 100% | Nosotros | Vía `gen_condicion_pago` |
| 3 | Límite de crédito configurable | ✅ 100% | Nosotros | Se guarda y se muestra |
| 4 | Edición de convenio existente | ✅ 100% | Nosotros | |
| 5 | Alerta/bloqueo al superar el límite de crédito | ❌ 0% | Sin asignar | Se aplica en el cobro (M12) |

> ❓ **Decisión pendiente (alcance §7):** ¿el límite **bloquea** el cobro o solo **advierte**?
> ❓ **Pedido tuyo sin implementar:** condiciones "para fin de mes" y "para quincena de este mes".
> Requiere una columna `tipo_vencimiento` en `gen_condicion_pago`, porque `dias_credito`
> (un entero) no puede expresar "vence el último día del mes".

---

### M07 — Cajas y Sucursales · Edgardo + Nosotros · 100% 🟩

| # | Requerimiento | Estado | Encargado |
|---|---|---|---|
| 1 | CRUD de sucursales | ✅ 100% | Edgardo |
| 2 | CRUD de cajas físicas | ✅ 100% | Nosotros |
| 3 | Estructura lista para múltiples cajas/sucursales | ✅ 100% | Ambos |

> El módulo de sucursales de Edgardo **no tiene ruta en `src/app`**: existe completo pero no
> es accesible desde el menú. Solo se usa como selector dentro de otros formularios.

---

### M08 — Turnos de Caja · Nosotros · 70%

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | Apertura con monto inicial (soporta S/.0) | ✅ 100% | Nosotros | |
| 2 | Registro de ingresos con concepto | ✅ 100% | Nosotros | |
| 3 | Egresos bloqueados si no hay saldo | ✅ 100% | Nosotros | Validado en BD y en UI |
| 4 | Cierre con conteo de denominaciones | ✅ 100% | Nosotros | Tabla de billetes y monedas |
| 5 | Efectivo esperado vs contado, con diferencia | ✅ 100% | Nosotros | Diferencia en vivo antes de confirmar |
| 6 | Vista de turno: pagos por medio | ✅ 100% | Nosotros | Saldrá en 0 hasta que exista M12 |
| 7 | Historial de turnos cerrados | ✅ 100% | Nosotros | Con detalle completo |
| 8 | 🆕 Medio de pago en cada egreso | ❌ 0% | Sin asignar | **Requiere columna nueva en `caj_movimiento`** |
| 9 | Vincular ventas del turno al cuadre | ⚠️ 50% | Nosotros | La lógica está escrita; espera M12 |
| 10 | Vincular planilla y gastos admin. al cuadre | ❌ 0% | Sin asignar | Depende de M16 y M17 |

> 🆕 **Lo más importante de este módulo tras la Reunión 2:** el ítem 8. Hoy `caj_movimiento`
> **no tiene columna `medio_pago`** — asume que todo egreso es en efectivo. El cliente aclaró
> que paga proveedores por Yape y tarjeta también. **Es un cambio de esquema.**

---

### M09 — Salón, Mesas y Pedidos · Sin asignar · 0% 🟥

| # | Requerimiento | Estado | Encargado |
|---|---|---|---|
| 1 | CRUD de salones (zonas) | ❌ 0% | Sin asignar |
| 2 | CRUD de mesas con estado y capacidad | ❌ 0% | Sin asignar |
| 3 | Mapa de salón con colores por estado | ❌ 0% | Sin asignar |
| 4 | Apertura de pedido en mesa | ❌ 0% | Sin asignar |
| 5 | Carrito con ítems, adicionales y observaciones | ❌ 0% | Sin asignar |
| 6 | Comandar (crea comanda por estación) | ❌ 0% | Sin asignar |
| 7 | Descuento de stock por receta al comandar | ❌ 0% | Sin asignar |
| 8 | Transiciones de estado del pedido | ❌ 0% | Sin asignar |
| 9 | Anulación con autorización y reverso de stock | ❌ 0% | Sin asignar |
| 10 | Vista precuenta | ❌ 0% | Sin asignar |

> **Es el núcleo del negocio y está en cero.** Habilita M10, M11, M12 y M13.
> Las tablas existen en el esquema; no hay una sola función ni pantalla.
> ❓ **Decisión pendiente:** ¿el mapa de salón es una grilla por zonas (el esquema lo soporta
> hoy) o un plano real con mesas arrastrables? Lo segundo necesita `pos_x`/`pos_y` en `ven_mesa`.

---

### M10 — Estaciones e Impresoras · Edgardo · 25%

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | CRUD de estaciones con impresora asociada | ✅ 100% | Edgardo | Tipo, IP y flag `usa_kds` |
| 2 | Ruteo automático de ítems según estación | ❌ 0% | Sin asignar | Depende de M09 |
| 3 | Pedidos "para llevar" van todos a cocina | ❌ 0% | Sin asignar | Regla nueva de la Reunión 2 |
| 4 | Preparado para escalar a 3 impresoras | ⚠️ 50% | Edgardo | El modelo lo soporta; falta el ruteo |

> 🔨 **Edgardo está trabajando acá ahora mismo.** No tocar.
> Falta validar el formato de IP de impresora: hoy se acepta cualquier texto.

---

### M11 — Inventario y Alertas de Stock · Sin asignar · 0%

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | Stock por producto y almacén | ⚠️ 20% | Sin asignar | La tabla existe; sin endpoints ni pantalla |
| 2 | Umbral de stock mínimo configurable | ⚠️ 20% | Sin asignar | La columna existe; sin endpoint |
| 3 | 🆕 Orden por defecto: menor stock primero | ❌ 0% | Sin asignar | Regla nueva de la Reunión 2 |
| 4 | Vista dedicada de alertas de stock | ❌ 0% | Sin asignar | La vista `vw_stock_alerta` ya existe en BD |

> El alcance marca 1 y 2 como `[x]` porque **existen en el esquema**. En código no hay nada:
> ni funciones SQL, ni módulo de NestJS, ni pantalla.

---

### M12 — Ventas, Cobro y Descuentos · Sin asignar · 0%

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | Registro de pago con medio | ❌ 0% | Sin asignar | Tabla `ven_pago` existe, sin código |
| 2 | Pago mixto | ❌ 0% | Sin asignar | |
| 3 | 🆕 CRUD de tipos de descuento (nombre + %) | ❌ 0% | Sin asignar | **No existe tabla en BD** |
| 4 | 🆕 Selector de descuento predefinido al cobrar | ❌ 0% | Sin asignar | |
| 5 | 🆕 Porcentaje de descuento libre | ❌ 0% | Sin asignar | |
| 6 | Descuento de consorcio (15%) automático a crédito | ❌ 0% | Sin asignar | |

> 🆕 **Cambio de esquema requerido:** la tabla de descuentos configurables no existe.
> Hoy el 15% del consorcio no está modelado en ninguna parte — ni siquiera como columna
> en `cli_convenio`.

---

### M13 — Cuentas por Cobrar (CxC) 🆕 · Nosotros · 90% 🟩

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | Consumo a crédito vinculado a persona y convenio | ✅ 100% | Nosotros | `cxc_registrar_consumo`, con `id_pedido`/`id_pago` listos para M12 |
| 2 | Saldo acumulado por período | ✅ 100% | Nosotros | `cxc_calcular_saldo_persona` + vista reescrita con totales y último abono |
| 3 | Reporte por persona y por convenio | ✅ 100% | Nosotros | `cxc_reporte_periodo`: agrupado por empresa con detalle de cada trabajador |
| 4 | Registro de abonos | ✅ 100% | Nosotros | `cxc_registrar_abono`, con tope: no puede superar la deuda |
| 5 | Descuento de convenio (15%) automático | ❌ 0% | **Bloqueado por M12** | El descuento se aplica al precio del pedido, no al movimiento de CxC |

**Lo que se construyó:**

- **10 funciones SQL** en `funciones/cuentas-por-cobrar/`. Sin DDL nuevo:
  `cxc_movimiento` ya existía en el esquema.
- **Vista `vw_cxc_saldo_persona` reescrita.** La original solo devolvía el saldo;
  le agregué documento, límite de crédito, totales de cargo/abono y último abono,
  para que quedara pareja con su espejo `vw_cxp_saldo_proveedor`. Va con `DROP`
  porque cambia columnas.
- **Módulo NestJS completo** (`cuentas-por-cobrar`) con 9 endpoints y 4 permisos.
- **Pantalla completa** con barra de crédito por cliente, filtro por empresa,
  estado de cuenta imprimible y el reporte de la quincena agrupado por empresa.

**Dos decisiones que tomé y conviene revisar con el cliente:**

1. **Pasarse del límite de crédito advierte, pero no bloquea.** El alcance dice
   "advertir o bloquear" y dejó la decisión abierta (§7). Elegí advertir porque
   bloquear en caja, con el cliente esperando su almuerzo, es el peor lugar para
   descubrir un tope. La advertencia viaja como `supera_limite` y se ve en tres
   sitios: al escribir el monto, al guardar, y como banner en la lista. Si deciden
   bloquear, es cambiar un `IF` en `cxc_registrar_consumo.sql`.
2. **No se puede anular un consumo que vino de un pedido, ni uno de una quincena
   ya cerrada.** Lo primero porque la venta manda; lo segundo porque si el corte
   ya se le envió a la empresa, cambiarle el pasado le rompe la conciliación. En
   los dos casos la salida es un ajuste, que queda explícito en el historial.

> **Sobre el 15% de descuento:** no es trabajo de este módulo. El descuento se
> aplica al **precio del pedido** en M12, y a CxC le llega el monto ya
> descontado. Cuando exista M12, esto se cierra solo.

---

### M14 — Gastos Diarios Operativos 🆕 · Nosotros · 100% 🟩

| # | Requerimiento | Estado | Encargado |
|---|---|---|---|
| 1 | Lista maestra de insumos frecuentes por categoría | ✅ 100% | Nosotros |
| 2 | Producto sin unidad fija (se define al registrar) | ✅ 100% | Nosotros |
| 3 | Formulario de registro rápido | ✅ 100% | Nosotros |
| 4 | Creación de producto "al vuelo" | ✅ 100% | Nosotros |
| 5 | Medio de pago por línea (efectivo/Yape/crédito) | ✅ 100% | Nosotros |
| 6 | Vínculo automático a proveedor si es crédito | ✅ 100% | Nosotros |
| 7 | Generación automática de deuda (CxP) | ✅ 100% | Nosotros |
| 8 | Reporte diario: efectivo + Yape + crédito | ✅ 100% | Nosotros |
| 9 | Vinculación al cuadre de turno (M08) | ✅ 100% | Nosotros |
| 10 | Historial con filtros | ✅ 100% | Nosotros |

**Tablas nuevas:** `gdo_categoria`, `gdo_insumo`, `gdo_gasto_dia`, `gdo_gasto_detalle`.
Las 9 categorías de la hoja física del cliente vienen sembradas.

**Decisión de modelado:** lista maestra propia (`gdo_insumo`), no `pro_producto`. El cliente
pidió que estos ítems **no tengan unidad de medida fija** ("Sal" se compra en kg un día y en
paquete otro), y `pro_producto` la exige obligatoria. Además es el catálogo de la carta, con
precio de venta y estación: meterle 200 insumos que nunca se venden ensuciaría el buscador
del punto de venta.

**Lo que cierra el circuito:**
- **`gdo_agregar_linea` llama a `cxp_registrar_cargo`** cuando la línea es a crédito. Es el
  enlace que dejó M15 preparado y que ahora funciona de punta a punta.
- **Al anular, `gdo_anular_linea` revierte el cargo** vía `cxp_anular_movimiento`. Si en CxP
  ya hubo movimientos posteriores de ese proveedor, la anulación falla con un mensaje claro
  — y está bien que falle: revertir uno del medio rompería los saldos del historial.

**Lo que aporta más allá del checklist:**
- **El día se abre solo.** `gdo_abrir_dia` es idempotente: el cajero entra a la pantalla y si
  es la primera compra el día se crea. No hay un paso de "crear el día".
- **El precio referencial sigue al último precio pagado**, así la próxima compra sugiere el
  precio real y no uno que quedó viejo.
- **Al elegir el insumo se autocompletan precio y proveedor habitual**; el cajero confirma.
- **Subtotal en vivo** antes de guardar, y las tres formas de pago como botones con su
  consecuencia escrita ("sale del cajón", "genera deuda al proveedor").
- **Totales denormalizados** en la cabecera del día, recalculados en cada cambio por una
  única función. El listado de días no re-suma el detalle en cada fila.
- **"Deuda generada hoy" por proveedor** en la pantalla: es lo que se va a abonar esta semana.

> ❓ **Decisión pendiente del cliente (alcance §7):** si el gasto diario debe **mover el stock**
> del almacén crudo cuando el insumo coincide con uno de inventario. **Hoy es puramente
> financiero**, que es lo que dice el alcance ("registrar el gasto del día para el cuadre de
> caja"). Si deciden que mueva stock, hay que enlazar `gdo_insumo` con `pro_producto` y
> escribir en `alm_kardex`.

---

### M15 — Cuentas por Pagar (CxP) 🆕 · Nosotros · 100% 🟩

| # | Requerimiento | Estado | Encargado | Nota |
|---|---|---|---|---|
| 1 | Deuda automática desde gasto a crédito (M14) | ✅ 100% | Nosotros | **M14 ya lo invoca**: `gdo_agregar_linea` llama a `cxp_registrar_cargo` |
| 2 | Saldo deudor acumulado por proveedor | ✅ 100% | Nosotros | Vista `vw_cxp_saldo_proveedor` |
| 3 | Registro de abono semanal | ✅ 100% | Nosotros | |
| 4 | Historial de movimientos por proveedor | ✅ 100% | Nosotros | Estado de cuenta con saldo tras cada movimiento |
| 5 | Alerta en dashboard de deudas por pagar | ✅ 100% | Nosotros | El endpoint de saldos con `solo_con_deuda` la alimenta |
| 6 | Reporte por proveedor y período | ✅ 100% | Nosotros | Falta solo el botón de exportar, transversal a todo el sistema |

**Tabla nueva:** `cxp_movimiento` + vista `vw_cxp_saldo_proveedor`.

**Decisión de modelado:** es el espejo de `cxc_movimiento`, con la misma forma a propósito
(tipo, monto, saldo_resultante, período) para que quien entienda uno entienda el otro.
Dos diferencias deliberadas:
- **Usa `semana` en vez de `quincena`.** El corte de CxC es quincenal porque se descuenta
  de planilla; el de proveedores es **semanal**. Guardar la semana ISO permite agrupar los
  abonos como realmente se hacen.
- **Tiene `id_gasto_diario`**, listo para que M14 enlace el cargo automático.

**Lo que aporta más allá del checklist:**
- **El `saldo_resultante` se guarda en cada movimiento**, como una foto. Permite reconstruir
  el estado de la cuenta en cualquier punto del historial sin re-sumar todo, y es lo que se
  le muestra al proveedor cuando hay discrepancia.
- **Solo se puede anular el último movimiento.** Anular uno del medio dejaría mintiendo a
  todas las fotos posteriores. Para corregir algo más viejo está el ajuste, que deja rastro.
- **El abono no puede superar la deuda** — validado en vivo en el modal, con botón "pagar todo".
- **Semáforo de atraso por proveedor**: con corte semanal, más de 7 días sin abonar se pinta
  en ámbar y más de 14 en rojo. Convierte la tabla en una alerta que se lee de un vistazo.
- **Desglose por semana** en el reporte, que es el ritmo real de pago.

> ⚠️ **Único ítem abierto:** el cargo automático del ítem 1. Todo lo necesario está hecho
> (endpoint `POST /cuentas-por-pagar/cargos` + columna de enlace); solo falta que M14 lo
> invoque al marcar una compra como "a crédito". Mientras tanto el cargo se registra a mano
> desde la misma pantalla.

---

### M16 — Gastos Administrativos 🆕 · Nosotros · 100% 🟩

| # | Requerimiento | Estado | Encargado |
|---|---|---|---|
| 1 | Categorías de gasto Fijo / Variable, con subcategorías | ✅ 100% | Nosotros |
| 2 | Formulario: categoría, concepto, monto, fecha, medio | ✅ 100% | Nosotros |
| 3 | Historial con filtros por categoría y período | ✅ 100% | Nosotros |
| 4 | Vínculo con dashboard (rentabilidad) | ✅ 100% | Nosotros |

**Tablas nuevas:** `gad_categoria` (autorreferente, un nivel de anidación) y `gad_gasto`.

**Decisión sobre las categorías:** el alcance decía "configurable, con posibilidad de
agregar subcategorías como Alquiler, Servicios, Mantenimiento" — así que las hice
**configurables por el cliente**, y sembré las que nombró en la reunión como punto de
partida: Alquiler, Servicios básicos (con Luz/Agua/Internet como subcategorías),
Sistemas y software, Mantenimiento, Útiles de oficina y Otros.
Eso resuelve la decisión pendiente §6-3 sin bloquear nada.

**Lo que aporta más allá del checklist:**
- **Reporte mensual con comparación contra el mes anterior** y variación porcentual.
  Es lo que permite notar que la luz subió o que el alquiler se pagó dos veces.
- **Desglose "en qué se fue el mes"** por categoría raíz, con barra proporcional.
  Las subcategorías se suman bajo su rama: interesa "Servicios: S/ 890" antes que
  el detalle de luz, agua e internet por separado.
- **Un gasto en efectivo exige turno de caja abierto**, igual que en planilla, para
  que el egreso cuadre con el cajón (M08).
- **El filtro por categoría incluye sus subcategorías**: filtrar "Servicios" muestra
  la luz y el agua, no una lista vacía.
- **Bloqueos que protegen el histórico**: no se cambia el tipo de una categoría que ya
  tiene gastos, ni se da de baja una con gastos o subcategorías activas, ni se edita un
  gasto en efectivo de un turno ya arqueado.

---

### M17 — Planilla 🆕 · Nosotros · 100% 🟩

| # | Requerimiento | Estado | Encargado |
|---|---|---|---|
| 1 | Registro simple de trabajador | ✅ 100% | Nosotros |
| 2 | Registro de pago: trabajador, monto, fecha | ✅ 100% | Nosotros |
| 3 | Filtro por quincena (día 2 / día 17) y mes | ✅ 100% | Nosotros |
| 4 | Vínculo con cuadre de caja y dashboard | ✅ 100% | Nosotros |
| 5 | Reporte de planilla por mes/quincena | ✅ 100% | Nosotros |

**Tablas nuevas:** `pla_trabajador`, `pla_pago` + índice parcial `uq_pla_pago_quincena`.

**Decisión de modelado:** tabla propia, no `cli_persona` ni `auth_usuario`. Un trabajador
es personal interno, no cliente/proveedor: meterlo en `cli_persona` ensuciaría los
buscadores de compras (M14) y cobro a crédito (M12). Y `auth_usuario` tampoco sirve porque
no todo trabajador entra al sistema — el personal de cocina cobra y nunca abre sesión.

**Lo que más valor aporta, más allá del checklist:**
- **La quincena se deduce de la fecha de pago**, no se elige. Un pago del 2 de octubre
  corresponde a la 2da quincena de *septiembre*; si el cajero lo eligiera a mano, el gasto
  caería en el mes equivocado y desviaría la rentabilidad de ambos meses.
- **Reporte del período con lista de pendientes:** responde "¿a quién falta pagarle?", que
  no sale de un simple listado de pagos. Cada pendiente es un botón que abre el pago con
  el trabajador y su sueldo ya cargados.
- **Un pago en efectivo exige turno de caja abierto**, para que el egreso cuadre con el
  cajón. Si no hay turno, la opción de efectivo se deshabilita en vez de fallar en la API.
- **Anulación en lugar de edición**, y bloqueada si el turno ya se cerró y arqueó.

---

### M18 — Facturación Electrónica · Bloqueado · 5%

| # | Requerimiento | Estado | Encargado |
|---|---|---|---|
| 1 | Definir proveedor OSE | ⬜ Bloqueado | Gerald (externo) |
| 2 | Estructura `ven_comprobante` en BD | ✅ 100% | Ya en el esquema |
| 3 | Emisión, reenvío, nota de crédito, impresión | ❌ 0% | Sin asignar |

> Bloqueado por decisión comercial externa. Además necesita `gen_correlativo` (M02 del
> documento técnico anterior), que tampoco está implementado.

---

## 3. Cambios de esquema que exige la Reunión 2

Ninguno de estos existe hoy en `database.sql`. **Conviene agruparlos en una sola migración**
en vez de ir tocando la BD módulo por módulo.

| # | Cambio | Módulo | Motivo |
|---|---|---|---|
| 1 | Columna `medio_pago` en `caj_movimiento` | M08 | Los egresos no son solo efectivo |
| 2 | Tabla de tipos de descuento (nombre + %) | M12 | Descuentos configurables reutilizables |
| ~~3~~ | ~~Tablas de gastos diarios~~ | M14 | ✅ **Hecho**: 4 tablas  |
| ~~4~~ | ~~Tablas de cuentas por pagar~~ | M15 | ✅ **Hecho**: `cxp_movimiento` + vista |
| ~~5~~ | ~~Tablas de gastos administrativos~~ | M16 | ✅ **Hecho**: `gad_categoria`, `gad_gasto` |
| ~~6~~ | ~~Tablas de planilla~~ | M17 | ✅ **Hecho**: `pla_trabajador`, `pla_pago` |
| ~~9~~ | ~~Vista de saldos de CxC~~ | M13 | ✅ **Hecho**: `vw_cxc_saldo_persona` reescrita con totales y límite |
| 7 | Columna `tipo_vencimiento` en `gen_condicion_pago` | M06 | "Fin de mes" y "quincena de este mes" |
| 8 | `pos_x` / `pos_y` en `ven_mesa` *(si se decide plano real)* | M09 | Decisión pendiente |

---

## 4. Reparto de trabajo sin choques

### 🔨 Zona de Edgardo — no tocar
**M03** (productos, categorías, subcategorías), **M04** (recetario), **M10** (estaciones),
almacenes y sucursales. Más los componentes compartidos del front (`Select`, `InputField`,
`FormModal`, `ToastContext`) y el `AppSidebar`.

### ✅ Zona nuestra — terminada
**M05** personas · **M06** convenios · **M07** cajas · **M08** turnos.

### 🎯 Zona nuestra — siguiente, sin choque con él

Estos cuatro no tocan ninguna tabla ni carpeta de Edgardo:

| Orden | Módulo | Por qué ahora | Depende de |
|---|---|---|---|
| ~~1~~ | ~~**M17 — Planilla**~~ | ✅ **Completo** | — |
| ~~2~~ | ~~**M16 — Gastos Administrativos**~~ | ✅ **Completo** | — |
| ~~3~~ | ~~**M15 — CxP Proveedores**~~ | ✅ **Completo** (salvo el enlace con M14) | — |
| ~~4~~ | ~~**M14 — Gastos Diarios**~~ | ✅ **Completo** | — |
| ~~5~~ | ~~**M13 — CxC Consorcio**~~ | ✅ **Completo** (salvo el 15%, que es de M12) | — |

Después de esos cuatro, el **flujo del cuadre diario** (alcance §5) queda cerrado salvo las
ventas. Y quedarían pendientes de decidir: M09 (pedidos) y M12 (cobro), que son grandes y
tocan `pro_producto` de Edgardo en modo lectura.

### Archivos que van a chocar igual
`app.module.ts`, `permiso-banderas.ts`, `AppSidebar.tsx` y `database.sql`.
Son conflictos de una o dos líneas. Para los permisos ya usamos un archivo por módulo
(`seeds/permisos/*.sql`), que elimina ese conflicto por completo.

---

## 5. Bloqueantes activos

| # | Bloqueante | Impacto | Responsable |
|---|---|---|---|
| 1 | **A la BD le faltaban 39 de 64 tablas** | Personas y caja **no arrancan** | Ejecutar `esquema_completo_reejecutable.sql` |
| 2 | Faltan 36 de 48 permisos en el seed | Módulos de Edgardo dan 403 salvo super admin | Sin asignar |
| 3 | `GET /productos/insumos-procesados` da 400 | Bloquea el constructor de recetas | Edgardo |
| 4 | Sin proveedor OSE definido | M18 detenido | Gerald |

> El bloqueante 1 es el más urgente: mientras no se ejecute, **nuestros dos módulos
> terminados no funcionan**. Detalle en [`anotaciones_pendientes.md`](./anotaciones_pendientes.md).

---

## 6. Decisiones pendientes del cliente

| # | Pregunta | Bloquea |
|---|---|---|
| 1 | ¿El límite de crédito **bloquea** el cobro o solo **advierte**? | M06, M12 |
| 2 | ¿Los gastos diarios **mueven stock** del almacén crudo o son solo financieros? | M14 |
| ~~3~~ | ~~¿Categorías de gasto predefinidas o libres?~~ → **resuelto**: configurables, con semilla inicial | ~~M16~~ |
| 4 | ¿Planilla se queda mínima o crecerá (cargo, contrato)? | M17 |
| 5 | ¿Mapa de salón: grilla por zonas o plano real arrastrable? | M09 |
| 6 | ¿"Fin de mes" y "quincena de este mes" como condiciones de pago? | M06 |
| 7 | ¿El egreso de caja siempre requiere autorización de un ADMIN? | M08 |
| 8 | ¿Login por PIN para mozos entra en este alcance? | M01 |
