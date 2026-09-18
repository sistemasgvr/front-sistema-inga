# Sistema Inga — Alcance Completo del Sistema
> Documento maestro: resumen de negocio + checklist funcional por módulo
> **Fuentes:** Reunión 1 (requerimientos iniciales) + Reunión 2 (demo del sistema + nuevos requerimientos) + esquema PostgreSQL `database.sql` + evidencia física (hoja de requerimiento diario y Excel de egresos)
> **Estado:** Los módulos marcados como "✅ Ya construido" corresponden a lo mostrado en el demo de la Reunión 2. Los marcados "🆕 Nuevo" surgen de esta segunda reunión y aún no están en el esquema de base de datos.

---

## 1. Contexto del Negocio

Inga es un restaurante que opera con carta a la carta, menú del día, barra de tragos y vinos, y atención a consorcios empresariales con crédito. Actualmente gestiona la operación combinando un sistema de terceros alquilado y múltiples hojas de Excel manuales:

- Excel de **requerimiento diario** (~200 productos clasificados por categoría, para saber qué comprar)
- Excel de **egresos caja día y noche** (cuadre diario de gastos)
- Excel de **inventarios**
- Excel de **flujo de caja mensual** (efectivo, Yape, Visa, gastos)
- Excel de **gastos administrativos** (fijos y variables: alquiler, luz, agua, internet)
- Excel de **planilla** (pagos quincenales a trabajadores)
- Excel de **pago a proveedores** (créditos con 4 proveedores: pollo, pescado, verduras, carnes)
- Registro manual de **consumos a crédito del consorcio** con descuento del 15%

El objetivo del sistema es eliminar todos estos Excel y centralizar la operación completa: ventas, compras, caja, planilla, gastos administrativos, crédito de clientes y de proveedores, todo con reportes y dashboard analítico.

### Actores del sistema
| Rol | Función |
|---|---|
| **ADMIN** | Control total, reportes, crédito, almacén, configuración, roles y permisos |
| **CAJERO** | Cobro, comprobantes, turno de caja, registro de gastos diarios |
| **MOZO** | Toma de pedidos y comandas |
| **CHEF** | KDS de cocina, órdenes de producción, alertas de receta |
| **BARMAN** | KDS de barra, comandas de tragos, stock de onzas |

### Principio de permisos granulares (confirmado en demo)
El sistema **no tiene roles fijos con permisos hardcodeados**. Cada rol se arma dinámicamente asignando permisos específicos por módulo y acción (crear, editar, activar, desactivar, listar, ver detalle). Esto permite crear roles intermedios, por ejemplo un rol que solo pueda "crear almacén" y "ver convenios" sin acceso a nada más. Los roles son 100% configurables desde el propio sistema, sin tocar código.

---

## 2. La Regla más Importante: Los Dos Inventarios

El sistema separa completamente el inventario crudo del inventario procesado. Esto no cambia con la nueva reunión, sigue siendo la base de todo el módulo de stock.

### Inventario 1 — Almacén Crudo
Insumos sin procesar comprados a granel (sacos, cajas, planchas). Nunca entra directo a una receta. Se mueve por compras (entrada) y vales de salida hacia cocina o barra (salida).

### Inventario 2 — Producción / Recetario
Insumos ya procesados y porcionados por el chef (presas, potes, onzas). Este sí entra a las recetas y se descuenta automáticamente con cada venta.

```
Chef solicita crudo → Admin autoriza salida de almacén → Chef procesa
  → Chef declara rendimiento → Ingresa a stock producción
    → Ventas explotan receta → Descuentan stock producción
```

> **Nota importante:** El nuevo módulo de **Gastos Diarios Operativos** (sección 12) es un registro de compra rápida y NO reemplaza este flujo. Es un registro de gasto para el cuadre de caja, no necesariamente mueve el almacén crudo salvo que el producto comprado esté vinculado a un ítem de inventario.

---

## 3. Checklist Completo por Módulo

---

### M01 — Autenticación, Roles y Permisos ✅ Ya construido

**Qué hace:** Controla el acceso al sistema con roles 100% configurables y permisos granulares por módulo y acción.

**Cómo se maneja:**
- Login con email + contraseña. Los mozos pueden tener login rápido por PIN (pendiente confirmar si se implementó en el demo o sigue en plan).
- Cada usuario se crea con nombres, correo y contraseña — la contraseña la define el administrador o el propio sistema, no depende de un proveedor externo.
- Los roles se crean libremente (ej. "Demostración", "Cajero Fin de Semana") y se les asignan permisos específicos: por cada módulo (almacenes, cajas, categorías, convenios, etc.) existen acciones independientes — **activar, crear, editar, desactivar, listar, ver detalle**.
- Un rol puede tener acceso de solo lectura a un módulo (ej. "solo puede ver convenios") sin poder modificarlo.
- Los roles se pueden editar (nombre, permisos) y eliminar.

**Checklist:**
- [x] CRUD de usuarios con nombre, correo, contraseña
- [x] CRUD de roles con nombre configurable
- [x] Matriz de permisos por módulo × acción (activar/crear/editar/desactivar/listar/ver detalle)
- [x] Asignación de uno o más roles por usuario
- [x] Edición y eliminación de roles
- [ ] Confirmar login rápido por PIN para mozos (verificar si ya está o queda pendiente)
- [ ] Auditoría: registrar qué usuario hizo qué acción y cuándo (recomendado dado el nivel de detalle de permisos)

---

### M02 — Dashboard ✅ Ya construido (ampliado en esta reunión)

**Qué hace:** Panel principal con métricas del negocio, filtrable por período.

**Cómo se maneja:**
- Al no haber datos operativos todavía, el dashboard está vacío hasta que los demás módulos entren en uso — es la vista que "se llena" conforme se opera el sistema.
- Filtro de período en la parte superior: rango de fechas, últimos 7/30 días, mes, año, o búsqueda por cliente específico (muestra solo los datos donde participó ese cliente).
- Se tomó como referencia un sistema similar (mostrado en la reunión) con panel de: ventas, compras, deudas por pagar, deudas por cobrar, rentabilidad, eficiencia.

**Métricas solicitadas (ampliación de esta reunión):**
- Ventas, ingresos y egresos a lo largo del tiempo
- Top productos/platos con más ventas y con menos rotación
- Historial de compras vs ventas (comparativo en el tiempo)
- Clientes con deudas pendientes (CxC)
- Deudas por pagar a proveedores (CxP) — 🆕 nuevo, ver sección 15
- Stock de productos con alertas (los de menor stock aparecen primero)
- Rentabilidad del período: ventas − todos los gastos (insumos + planilla + administrativos)
- Gastos totales vs planilla (% que consume la planilla de las ventas)
- Gastos de insumos vs total de ventas (% que consumen los insumos)
- Acumulado por rango de meses (ej. "ver octubre + noviembre + diciembre juntos")
- Medio de pago con más ingresos (efectivo/Yape/tarjeta/crédito)

**Checklist:**
- [x] Filtro de período (rango de fechas, últimos N días, mes, año)
- [x] Filtro por cliente específico
- [ ] Gráfico de ventas por período (línea o barras)
- [ ] Gráfico de ingresos vs egresos
- [ ] Top platos más vendidos / menos vendidos (ranking)
- [ ] Comparativo compras vs ventas en el tiempo
- [ ] Tarjeta de deudas por cobrar (CxC consorcio)
- [ ] Tarjeta de deudas por pagar (CxP proveedores) 🆕
- [ ] Indicador de rentabilidad (ventas − gastos totales)
- [ ] Gráfico gastos vs planilla (%)
- [ ] Gráfico gastos de insumos vs ventas totales (%)
- [ ] Tabla de productos con stock bajo (ordenados de menor a mayor stock)
- [ ] Vista acumulada multi-mes (ej. Q4 completo)

---

### M03 — Productos, Categorías y Subcategorías ✅ Ya construido

**Qué hace:** Catálogo central de todo lo que vende o compra el restaurante, organizado jerárquicamente.

**Cómo se maneja:**
- **Categorías:** agrupan la carta de forma general (ej. "Bebidas y Cócteles", "Entradas", "Criollos").
- **Subcategorías:** desglosan más específico dentro de cada categoría (ej. dentro de "Bebidas y Cócteles" → "Cócteles con Pisco"; otros ejemplos vistos: "Ceviches y Mariscos", "Verduras y Frutas", "Carnes Rojas y Aves").
- Un producto nuevo se crea con nombre, categoría/subcategoría, precio de venta. El **código interno es opcional** — se puede dejar que el sistema lo autogenere por enumeración si no se quiere digitar manualmente.
- Los meseros y encargados de compra deben poder **crear productos nuevos sobre la marcha** cuando algo no está en el catálogo (ej. un corte de carne especial para una reserva), con su propio precio, sin necesitar pasar por administración.
- El precio de venta se puede editar constantemente (ej. precio especial por reserva o grupo grande).

**Checklist:**
- [x] CRUD de categorías
- [x] CRUD de subcategorías anidadas a categoría
- [x] CRUD de productos con nombre, categoría, subcategoría, precio
- [x] Código interno opcional / autogenerado
- [ ] Creación rápida de producto "al vuelo" desde el punto de venta o desde el registro de gastos (para mozos/cajeros sin pasar por admin)
- [ ] Historial de cambios de precio por producto (para trazabilidad de precios especiales)

---

### M04 — Recetario (ya definido en documentos previos, sin cambios en esta reunión)

**Qué hace:** Asocia a cada plato/trago su receta con insumos procesados y cantidades exactas para descuento automático de stock.

**Checklist:** *(ver documento de tareas técnicas anterior para detalle completo — no se tocó en esta reunión)*
- [x] Definición de recetas versionadas
- [x] Insumos con cantidad, unidad, merma, opcionales, grupos de sustitución
- [ ] Aún pendiente de desarrollo/demo (no mostrado en Reunión 2)

---

### M05 — Personas (Clientes y Proveedores) ✅ Ya construido

**Qué hace:** Registro unificado de toda persona natural o jurídica que interactúa con el restaurante, ya sea comprando (cliente) o vendiendo (proveedor).

**Cómo se maneja:**
- Al crear una persona se elige el tipo: **Persona Natural** o **Empresa**.
  - Empresa → obliga a ingresar RUC.
  - Persona Natural → permite elegir entre DNI, Carné de Extranjería o RUC (para naturales con negocio).
- Una persona puede marcarse como **Cliente**, **Proveedor**, o **ambos** simultáneamente (caso frecuente en la práctica del restaurante).
- Si la persona pertenece a un convenio de consorcio (ej. ApuSalud, 4G), se le asigna directamente desde su ficha.
- Teléfono y correo son opcionales; dirección también.

**Checklist:**
- [x] CRUD de personas con tipo (natural/empresa)
- [x] Selector de tipo de documento (DNI/CE/RUC) según tipo de persona
- [x] Flags independientes: es_cliente, es_proveedor
- [x] Asignación de convenio a la persona
- [x] Campos opcionales: correo, teléfono, dirección
- [x] Edición de datos de persona

---

### M06 — Convenios ✅ Ya construido

**Qué hace:** Administra las empresas del consorcio con las que Inga tiene acuerdo de crédito y descuento.

**Cómo se maneja:**
- Se crea con un código corto/abreviatura (ej. "4G" para "4G Security") y nombre completo.
- Se define si el crédito es **quincenal** o **a 30 días**.
- Se configura un **límite de crédito** por convenio (ej. S/. 500 máximo para 4G). El sistema debe advertir o bloquear si el consumo acumulado supera ese límite.
- Editable en cualquier momento (límite, condición de pago, etc.).

**Checklist:**
- [x] CRUD de convenios con código y nombre
- [x] Selector de condición de pago: quincenal / 30 días
- [x] Límite de crédito configurable por convenio
- [x] Edición de convenio existente
- [ ] Validación/alerta cuando el consumo acumulado se acerca o supera el límite de crédito

---

### M07 — Cajas y Sucursales ✅ Ya construido

**Qué hace:** Registra las cajas físicas del local y las sucursales, preparando el sistema para escalar a más de un punto de cobro o local.

**Cómo se maneja:**
- Actualmente Inga tiene **1 caja física** y **1 sucursal**, pero el módulo está pensado para múltiples (ej. "Caja Principal", "Caja Segundo Piso", "Caja Zona Bar" si en el futuro abren más puntos de cobro).
- Cada caja se registra con código y nombre, asociada a una sucursal.

**Checklist:**
- [x] CRUD de sucursales (código, nombre)
- [x] CRUD de cajas físicas (código, nombre, sucursal asociada)
- [x] Estructura lista para múltiples cajas/sucursales sin cambios de arquitectura

---

### M08 — Turnos de Caja ✅ Ya construido (ampliado en esta reunión)

**Qué hace:** Gestiona la apertura, movimientos y cierre de cada turno de caja, con conteo físico al cierre.

**Cómo se maneja:**

**Apertura:**
- Al aperturar, el sistema pregunta con cuánto monto se inicia la caja. Inga siempre inicia en **S/. 0**, pero el sistema soporta cualquier monto inicial.

**Movimientos durante el turno:**
- Se pueden registrar **ingresos** y **egresos** de caja con concepto/motivo libre.
- Regla de negocio: **no se puede registrar un egreso si la caja no tiene saldo disponible** — primero debe existir un ingreso que lo respalde.
- Ejemplo validado en el demo: ingreso de S/. 200 "para gastos" → luego egreso de S/. 20 "compra de aguas" (válido porque había saldo).

**🆕 Ampliación solicitada — medio de pago en los movimientos:**
El cliente aclaró que sus egresos no son solo en efectivo. En su Excel diferencian "egresos caja" (efectivo del día) de "egresos tarjeta/Yape" (pagos a proveedores por esas vías). El sistema debe permitir indicar el **medio de pago del egreso** (efectivo, Yape, tarjeta), no asumir que todo movimiento de caja es en efectivo.

**Cierre de turno:**
- Al cerrar, el sistema pide el **conteo físico de billetes y monedas** por denominación (200, 100, 50, 20, 10 y monedas hasta S/1).
- El sistema calcula el **"efectivo esperado"**: monto de apertura + ingresos − egresos registrados en el sistema.
- Compara contra lo **contado físicamente** y muestra la diferencia (sobrante o faltante). Ejemplo del demo: esperado S/.165, contado S/.3003 → diferencia de sobrante S/.2838 (nota: esto en el demo estaba con datos de prueba, no reales).
- El cierre debe **complementarse con las ventas del turno**: pagos en efectivo, Yape, tarjeta y crédito, para dar el cuadre real total, no solo los movimientos manuales de caja.

**Historial de turnos:**
- Se puede consultar turnos anteriores, ver el detalle de pagos por medio (efectivo/Yape/tarjeta/crédito), total de ingresos y egresos de cada turno cerrado.

**Checklist:**
- [x] Apertura de turno con monto inicial configurable (soporta S/.0)
- [x] Registro de ingresos de caja con concepto
- [x] Registro de egresos de caja con motivo, bloqueado si no hay saldo suficiente
- [x] Cierre de turno con conteo de denominaciones (billetes y monedas)
- [x] Cálculo automático de efectivo esperado vs contado, con diferencia
- [x] Vista de turno actual: pagos por medio (efectivo/Yape/tarjeta/crédito)
- [x] Historial de turnos cerrados
- [ ] 🆕 Campo de medio de pago (efectivo/Yape/tarjeta) en cada movimiento de egreso, no solo efectivo
- [ ] Vincular automáticamente el resumen de ventas del turno (no solo movimientos manuales) al cuadre final
- [ ] Vincular el pago de planilla y gastos administrativos al cuadre del día cuando corresponda

---

### M09 — Salón, Mesas y Pedidos (definido en documentos previos, sin cambios en esta reunión)

*(No se tocó en la Reunión 2 — sigue vigente el diseño anterior con estados ABIERTO → COMANDADO → POR_COBRAR → PAGADO / ANULADO)*

---

### M10 — Estaciones e Impresoras 🔶 Parcialmente construido / pendiente

**Qué hace:** Define hacia dónde se enruta cada comanda según el tipo de producto (cocina, barra, caja).

**Cómo se maneja (aclarado en esta reunión):**
- Actualmente Inga tiene **2 impresoras físicas**: una en cocina y otra en caja/administración.
- Flujo actual sin sistema: las jarras de refresco se imprimen en caja, y el mozo físicamente lleva el ticket a la zona de barra.
- El plan ideal es tener **3 impresoras**: cocina, barra y caja — pero la tercera (barra) aún no se ha comprado.
- Cuando un pedido es **"para llevar"**, todo el ticket sale netamente por cocina (no se reparte entre estaciones).
- Este módulo quedó pendiente de configurar en el sistema — se mencionó explícitamente que "estaciones lo vamos a ver para agregarlo también" al cierre de la reunión.

**Checklist:**
- [ ] CRUD de estaciones (cocina, barra, caja) con impresora asociada
- [ ] Ruteo automático de ítems según estación del producto (mientras solo hay 2 impresoras, tragos/bebidas deben ir junto con cocina o caja según se decida)
- [ ] Lógica especial para pedidos "para llevar": todo el ticket va a una sola estación (cocina)
- [ ] Preparar el ruteo para escalar a 3 impresoras sin cambios estructurales cuando compren la de barra

---

### M11 — Inventario y Alertas de Stock ✅ Confirmado, ampliado en esta reunión

**Qué hace:** Mantiene el stock actualizado y genera alertas visuales de productos con bajo inventario.

**🆕 Ampliación solicitada en esta reunión:**
El cliente pidió explícitamente que las alertas de stock bajo tengan **prioridad visual**: los productos con menor stock deben aparecer siempre primero en la lista/reporte (orden ascendente por cantidad disponible), de forma que lo más crítico (stock en 0, 1 o 2 unidades) se vea de inmediato sin tener que buscarlo.

**Checklist:**
- [x] Registro de stock por producto y almacén (heredado del diseño anterior)
- [x] Umbral de stock mínimo configurable
- [ ] 🆕 Ordenamiento por defecto: productos con menor stock disponible aparecen primero en listados y alertas
- [ ] Vista dedicada de "Alertas de stock" accesible desde el dashboard

---

### M12 — Ventas, Cobro y Descuentos ✅ Confirmado, ampliado en esta reunión

**Qué hace:** Registra el cobro del pedido con soporte para múltiples medios de pago y aplicación de descuentos por convenio o promoción.

**🆕 Ampliación — tabla de descuentos configurables:**
Antes solo existía el 15% fijo del consorcio dentro de `cli_convenio`. Ahora se pide una **tabla de descuentos independiente y reutilizable**, porque Inga maneja distintos porcentajes según el motivo:
- Descuento Corporativo (Consorcio) — 15%, siempre el mismo para todos los convenios.
- Descuento por Activación / Evento — 10%.
- Otro tipo de vale promocional — 5% (mencionado como ejemplo).

**Cómo se maneja:**
- Se crea un registro de descuento con **nombre descriptivo** (ej. "Descuento corporativo consorcio", "Descuento activación Universidad X") y su **porcentaje**.
- Al momento del cobro, el cajero puede:
  - Seleccionar un descuento de la lista predefinida, o
  - Ingresar un porcentaje libre directamente en el pago si es un caso puntual no registrado.
- El descuento del consorcio (15%) sigue siendo el mismo para todos los convenios — no varía por empresa, es una política única del restaurante.

**Checklist:**
- [x] Registro de pago con medio (efectivo/Yape/tarjeta/crédito) — heredado del diseño anterior
- [x] Pago mixto (múltiples medios en un mismo pedido) — heredado
- [ ] 🆕 CRUD de tipos de descuento (nombre + porcentaje)
- [ ] 🆕 Selector de descuento predefinido al momento del cobro
- [ ] 🆕 Campo alternativo para ingresar porcentaje de descuento libre (casos puntuales)
- [ ] Aplicar automáticamente el descuento de consorcio (15%) cuando el pago es a crédito de convenio

---

### M13 — Cuentas por Cobrar (CxC) — Consorcio ✅ Confirmado, sin cambios estructurales

**Qué hace:** Registra los consumos a crédito de los trabajadores del consorcio y su saldo acumulado mensual.

**Confirmado en esta reunión:**
- El flujo se activa al momento del pago: se selecciona la opción de convenio, se identifica a la persona, y el consumo queda registrado como deuda.
- El corte y reporte se comparte con cada empresa aproximadamente el 2 o 3 de cada mes, y el consorcio abona.
- Esto ya estaba cubierto en el diseño de base de datos anterior (`cxc_movimiento`), no requiere cambios de estructura — solo se confirmó el flujo end-to-end junto con el nuevo módulo de descuentos.

**Checklist:** *(sin cambios respecto al documento anterior, confirmado como correcto)*
- [x] Registro de consumo a crédito vinculado a persona y convenio
- [x] Cálculo de saldo acumulado por período (quincena/mes)
- [x] Reporte de saldo por persona y por convenio
- [ ] Aplicación automática del descuento de convenio (15%) en el registro del consumo (vínculo con M12)

---

### M14 — Gastos Diarios Operativos (Compras Rápidas) 🆕 Nuevo módulo completo

**Qué hace:** Reemplaza el Excel de "Egresos Caja Día y Noche" (Imagen 2) y la hoja de "Requerimiento Diario" (Imagen 1). Es un registro ágil de las compras/gastos del día a día ligados a la operación de cocina, distinto de una compra formal a proveedor con comprobante.

**Diferencia clave con el módulo de Compras formal (ya definido antes):**
| | Compra formal (`com_compra`) | Gastos Diarios Operativos (nuevo) |
|---|---|---|
| Frecuencia | Semanal | Diaria |
| Formalidad | Con comprobante de proveedor, condición de pago | Registro rápido, sin necesariamente comprobante |
| Objetivo | Ingresar stock formal al almacén crudo | Registrar el gasto del día para el cuadre de caja |
| Cantidad de ítems | Pocos, por pedido grande | Muchos ítems pequeños y variados por día |

**Cómo se maneja (según lo descrito por el cliente en la reunión):**
- Se crea una **lista maestra de productos/insumos frecuentes** organizada exactamente por las categorías de su hoja física:
  - Procesados
  - Abarrotes
  - Verduras y Frutas
  - Carnes y Pollo
  - Pescados y Mariscos
  - Descartables
  - Aseo y Limpieza
  - Licores y Gaseosas
  - Otros
- Cada producto en esta lista **no tiene una unidad de medida fija predefinida** — se deja en blanco y se completa al momento de registrar la compra (ej. "Sal" puede comprarse en kg un día y en paquete otro día). El cajero/encargado elige la unidad y la cantidad al momento de registrar.
- Al registrar el gasto diario: buscar el producto en la lista, indicar cantidad, unidad de medida y precio pagado.
- Si el producto no está en la lista (caso de compra especial, ej. un corte de carne para una reserva), el propio cajero o encargado **puede crearlo en el momento**, tal como se crea un plato nuevo en el catálogo.
- **Medio de pago por ítem:** cada línea de gasto debe indicar si fue pagada **al contado (efectivo o Yape)** o **a crédito**. Esto es crítico porque Inga trabaja con 4 proveedores a crédito (pollo, pescado, verduras, carnes) que se abonan semanalmente.
- Si el ítem se marca como crédito, genera automáticamente una **deuda del restaurante hacia ese proveedor** (ver M15 — Cuentas por Pagar).
- **Reporte diario:** al cierre del día, el sistema debe mostrar el desglose: cuánto se gastó en efectivo, cuánto en Yape y cuánto quedó a crédito, replicando el cuadre que hoy hacen manualmente en el Excel de "Egresos Caja Día y Noche".

**Checklist:**
- [ ] Lista maestra de productos/insumos frecuentes, precargada por categoría (Procesados, Abarrotes, Verduras/Frutas, Carnes/Pollo, Pescados/Mariscos, Descartables, Aseo/Limpieza, Licores/Gaseosas, Otros)
- [ ] Producto de la lista sin unidad de medida fija — se define al momento del registro
- [ ] Formulario de registro rápido: buscador de producto, cantidad, unidad, precio
- [ ] Creación de producto nuevo "al vuelo" desde el mismo formulario si no está en la lista
- [ ] Selector de medio de pago por línea: Contado Efectivo / Contado Yape / Crédito
- [ ] Vínculo automático a proveedor cuando el ítem es a crédito
- [ ] Generación automática de deuda (CxP) cuando el ítem es a crédito
- [ ] Reporte diario de gastos: total efectivo + total Yape + total crédito
- [ ] Vinculación del reporte diario al cuadre de turno de caja (M08)
- [ ] Historial de gastos diarios con filtro por fecha, categoría y proveedor

---

### M15 — Cuentas por Pagar (CxP) — Proveedores 🆕 Nuevo módulo completo

**Qué hace:** Registra y da seguimiento a las deudas que el restaurante tiene con sus proveedores de crédito. Es el módulo espejo del CxC (donde el consorcio le debe a Inga), pero aquí es Inga quien debe.

**Cómo se maneja:**
- Inga trabaja con **4 proveedores a crédito fijos**: pollo, pescado, verduras y carnes.
- Cada vez que un ítem del módulo de Gastos Diarios Operativos (M14) se marca como "a crédito", se genera un movimiento de deuda vinculado a ese proveedor.
- El abono a proveedores se hace **semanalmente**, con montos variables según lo consumido esa semana (ejemplo mencionado: S/.1000, S/.100, S/.100, S/.800 dependiendo del proveedor y la semana).
- El sistema debe mostrar el saldo deudor acumulado por proveedor y permitir registrar el abono cuando se paga.
- El dashboard debe reflejar esta deuda como una alerta visible ("Deudas por pagar"), tal como se pidió explícitamente en la reunión ("ese monto de crédito se tendría que agregar como una deuda... como una alerta").

**Checklist:**
- [ ] Registro automático de deuda cuando un gasto diario (M14) se marca como crédito
- [ ] Vista de saldo deudor acumulado por proveedor
- [ ] Registro de abono semanal a proveedor (reduce el saldo)
- [ ] Historial de movimientos de deuda por proveedor (cargos y abonos)
- [ ] Alerta visible en el dashboard de "Deudas por pagar" totales y por proveedor
- [ ] Reporte exportable de CxP por proveedor y período

---

### M16 — Gastos Administrativos 🆕 Nuevo módulo completo

**Qué hace:** Registra los gastos del restaurante que **no están relacionados con la preparación de alimentos** — es decir, todo lo que hoy vive en el "Excel de flujo de caja mensual" bajo gastos administrativos.

**Cómo se maneja:**
- Se diferencian dos tipos de gasto:
  - **Gastos Fijos:** alquiler del local, luz, agua, internet, sistema (suscripciones) — se repiten mensualmente con montos similares.
  - **Gastos Variables:** arreglos del local, compras puntuales, útiles de oficina — no tienen periodicidad fija.
- El cliente pidió que sea simple: **solo clasificar el gasto e ingresar el monto**, sin necesidad de un flujo complejo.
- Este módulo alimenta el cuadre mensual completo, junto con planilla (M17) y los gastos operativos diarios (M14), para dar la visión real de rentabilidad que pidió el cliente en el dashboard.

**Checklist:**
- [ ] Categorías de gasto: Fijo / Variable (configurable, con posibilidad de agregar subcategorías como "Alquiler", "Servicios", "Mantenimiento")
- [ ] Formulario simple: categoría, concepto, monto, fecha, medio de pago
- [ ] Historial de gastos administrativos con filtro por categoría y período
- [ ] Vínculo con el dashboard: gastos administrativos como parte del cálculo de rentabilidad total

---

### M17 — Planilla 🆕 Nuevo módulo completo

**Qué hace:** Registra los pagos de sueldo al personal para que el cuadre de caja y flujo mensual sea exacto.

**Cómo se maneja:**
- **No es un módulo de RRHH completo** — el cliente fue explícito: "registrar trabajadores, registrar pagos de planilla, nada más. O sea, serían solamente pagos."
- Se registra al trabajador (nombre) y se le asocian pagos de planilla con monto y fecha.
- Inga paga planilla **dos veces al mes: el día 2 y el día 17**.
- El propósito principal es que el gasto de planilla se refleje en el cuadre: ejemplo dado por el cliente — si hay S/.20,000 en la cuenta y la planilla de la quincena fue S/.8,000, debe quedar reflejado que el saldo real después de planilla y otros gastos del día es de aproximadamente S/.11,500.

**Checklist:**
- [ ] Registro simple de trabajador (nombre, puesto opcional)
- [ ] Registro de pago de planilla: trabajador, monto, fecha de pago
- [ ] Filtro de pagos por quincena (día 2 / día 17) y por mes
- [ ] Vínculo con el cuadre de caja y el dashboard (gasto de planilla como parte de los egresos totales del período)
- [ ] Reporte de planilla pagada por mes/quincena, total y detalle por trabajador

---

### M18 — Facturación Electrónica (sin cambios, pendiente confirmación externa)

**Qué hace:** Emisión de boletas y facturas conectadas a SUNAT.

**Estado en esta reunión:** Sigue pendiente de definir el proveedor. El cliente (Gerald) quedó en confirmar con su proveedor actual del sistema si la facturación electrónica viene incluida o es un servicio aparte, ya que resultaba más accesible económicamente. Aún no hay respuesta al cierre de esta segunda reunión.

**Checklist:** *(sin cambios respecto al documento técnico anterior — sigue pendiente de la resolución comercial con el proveedor)*
- [ ] Definir proveedor OSE definitivo (pendiente de respuesta externa)
- [x] Estructura de comprobante ya diseñada en base de datos (`ven_comprobante`)

---

## 4. Resumen de Alcance Total del Sistema

```
SISTEMA INGA
│
├── Núcleo administrativo
│   ├── M01 Autenticación, Roles y Permisos          ✅
│   ├── M02 Dashboard                                 ✅ (ampliado)
│
├── Catálogo y Operación de Venta
│   ├── M03 Productos, Categorías y Subcategorías     ✅
│   ├── M04 Recetario                                 🔶 pendiente demo
│   ├── M09 Salón, Mesas y Pedidos                     🔶 sin cambios, pendiente
│   ├── M10 Estaciones e Impresoras                    🔶 pendiente de configurar
│   ├── M11 Inventario y Alertas de Stock              ✅ (ampliado)
│   ├── M12 Ventas, Cobro y Descuentos                 ✅ (ampliado)
│   └── M18 Facturación Electrónica                    🔶 pendiente proveedor
│
├── Personas y Crédito
│   ├── M05 Personas (Clientes y Proveedores)          ✅
│   ├── M06 Convenios                                  ✅
│   ├── M13 Cuentas por Cobrar (CxC) — Consorcio       ✅
│   └── M15 Cuentas por Pagar (CxP) — Proveedores       🆕 nuevo
│
├── Caja y Finanzas Operativas
│   ├── M07 Cajas y Sucursales                          ✅
│   ├── M08 Turnos de Caja                              ✅ (ampliado)
│   ├── M14 Gastos Diarios Operativos                   🆕 nuevo
│   ├── M16 Gastos Administrativos                      🆕 nuevo
│   └── M17 Planilla                                    🆕 nuevo
│
└── Leyenda: ✅ Ya construido / demo mostrado  🔶 Parcial o pendiente  🆕 Nuevo, sin desarrollar aún
```

---

## 5. Flujo Integral del Cuadre Diario (nuevo, consolidado de esta reunión)

Este es el flujo que da sentido a los tres módulos nuevos (M14, M16, M17) en conjunto con el turno de caja (M08):

```
1. Admin abre turno de caja (M08) con monto inicial (usualmente S/.0)

2. Durante el día:
   a. Ventas normales del salón/pedidos → pagos efectivo/Yape/tarjeta/crédito (M12)
   b. Compras rápidas de insumos del día (M14) → cada ítem: contado o crédito
      → si crédito: genera deuda a proveedor (M15)
   c. Eventuales gastos administrativos puntuales (M16), si aplica ese día

3. Cada 15 días (día 2 y día 17):
   a. Se registra el pago de planilla (M17)

4. Al cierre del turno (M08):
   a. Sistema calcula efectivo esperado = apertura + ventas efectivo + ingresos − egresos
   b. Cajero cuenta físicamente billetes y monedas
   c. Sistema muestra diferencia (sobrante/faltante)
   d. El cuadre se complementa con: ventas por todos los medios + gastos diarios (M14)
      + gastos administrativos del día (M16) + planilla si corresponde ese día (M17)

5. Reportes mensuales/dashboard (M02):
   a. Ventas totales del período
   b. Gastos de insumos (M14) + administrativos (M16) + planilla (M17)
   c. Rentabilidad = ventas − todos los gastos
   d. Deudas por cobrar (M13) vs deudas por pagar (M15)
   e. % de las ventas que se va en planilla, % que se va en insumos
```

---

## 6. Reglas de Negocio Nuevas (de esta reunión)

| # | Regla |
|---|-------|
| 1 | No se puede registrar un egreso de caja si no existe saldo suficiente (validado en demo). |
| 2 | Cada movimiento de caja debe indicar su medio de pago (efectivo/Yape/tarjeta), no se asume solo efectivo. |
| 3 | Los productos de la lista de gastos diarios frecuentes no tienen unidad de medida fija — se define al momento de cada registro. |
| 4 | Cualquier usuario operativo (cajero, encargado de compras) puede crear un producto nuevo "al vuelo" si no existe en el catálogo o en la lista de insumos frecuentes. |
| 5 | Todo ítem de gasto diario debe clasificarse como contado o crédito; el crédito genera automáticamente una deuda (CxP) hacia el proveedor correspondiente. |
| 6 | El descuento del consorcio (15%) es fijo y único para todos los convenios — no varía por empresa. |
| 7 | Pueden existir múltiples tipos de descuento configurables además del corporativo (ej. activaciones, promociones puntuales). |
| 8 | Las alertas de stock deben ordenar siempre primero los productos con menor cantidad disponible. |
| 9 | Los pedidos "para llevar" enrutan toda la comanda a una sola estación (cocina), sin dividir por tipo de ítem. |
| 10 | Los roles no tienen permisos fijos predefinidos: cada permiso se asigna de forma independiente por módulo y acción. |

---

## 7. Pendientes y Preguntas Abiertas

- [ ] Confirmar si el login por PIN para mozos ya está implementado o sigue en desarrollo.
- [ ] Definir si el registro de "gasto diario operativo" (M14) debe o no mover el stock del almacén crudo cuando el producto comprado coincide con un insumo de inventario, o si es puramente contable/financiero.
- [ ] Confirmar estructura de categorías de gasto administrativo (¿fijas predefinidas o el cliente las crea libremente?).
- [ ] Definir si planilla necesita más campos a futuro (cargo, tipo de contrato) o se mantiene mínima como se pidió.
- [ ] Resolución pendiente con el proveedor de facturación electrónica actual de Gerald (accesibilidad de costos).
- [ ] Confirmar diseño final de estaciones e impresoras cuando compren la tercera impresora (barra).
- [ ] Validar si el límite de crédito por convenio (M06) debe bloquear el cobro o solo advertir cuando se supera.

