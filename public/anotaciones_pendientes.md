# Anotaciones técnicas y pendientes — Sistema Inga

> Cuaderno de trabajo. Existe para que, si se pierde el contexto de la conversación,
> cualquiera pueda retomar sin redescubrir lo que ya sabíamos.
>
> **Jerarquía de documentos:**
> 1. [`alcance_completo_sistema_inga.md`](./alcance_completo_sistema_inga.md) — **manda sobre todo**
> 2. [`progreso.md`](./progreso.md) — avance por módulo y reparto de trabajo
> 3. Este archivo — detalle técnico, bloqueantes y decisiones tomadas
>
> **Reescrito el 18/09/2026** para alinearlo al alcance completo (numeración M01–M19).
> La numeración de módulos cambió respecto a versiones anteriores de este cuaderno.

---

## 1. 🔴 BLOQUEANTE — pasos de base de datos

### La base no tiene todo el esquema aplicado

El diagnóstico confirmó que faltaban **39 de las 64 tablas**. Solo existían las de los
módulos de Edgardo (`auth_*`, casi todas las `gen_*`, `pro_*` y `alm_producto_stock`).
Faltaban `cli_persona`, `cli_convenio`, `gen_condicion_pago`, las cuatro `caj_*`,
`cxc_movimiento` y `ven_pago`, entre otras.

Síntoma: `relation "caj_caja" does not exist` (código 42P01) al abrir `/caja/cajas`.

**Por qué los scripts de funciones "pasaron" sin error:** plpgsql **no valida las
referencias a tablas al crear la función**. Postgres guarda el cuerpo como texto y
resuelve los nombres recién al ejecutarla. Que un script de funciones corra limpio
**no** garantiza que las tablas que usa existan.

### Orden de ejecución

Todo vive en `api-sistema-inga/database_sql/`:

```
1. esquema_completo_reejecutable.sql        ← PRIMERO, sin excepción
2. funciones/personas/                      (15 funciones)
3. funciones/caja/                          (17 funciones)
4. funciones/planilla/                      (11 funciones)
5. funciones/gastos-administrativos/        (12 funciones)
6. funciones/cuentas-por-pagar/             (10 funciones)
7. funciones/gastos-diarios/                (12 funciones)  ← DESPUÉS de cuentas-por-pagar
8. funciones/cuentas-por-cobrar/            (10 funciones)
9. seeds/permisos/01_auth.sql
10. seeds/permisos/02_personas.sql
11. seeds/permisos/03_caja.sql
12. seeds/permisos/04_planilla.sql
13. seeds/permisos/05_gastos_administrativos.sql
14. seeds/permisos/06_cuentas_por_pagar.sql
15. seeds/permisos/07_gastos_diarios.sql
16. seeds/permisos/08_cuentas_por_cobrar.sql
```

> ⚠️ **`gastos-diarios` va después de `cuentas-por-pagar`**, no al revés:
> `gdo_agregar_linea` llama a `cxp_registrar_cargo` y `gdo_anular_linea` a
> `cxp_anular_movimiento`. Es el enlace que cierra el circuito del cuadre diario.

Las categorías base de gasto (Alquiler, Servicios con Luz/Agua/Internet,
Sistemas, Mantenimiento, Oficina, Otros) ya vienen en el propio
`esquema_completo_reejecutable.sql`, no hace falta un seed aparte.

Las semillas van numeradas por orden de ejecución. `01_auth.sql` primero porque
los demás módulos asumen que la tabla `auth_permiso` ya tiene sus filas base.

> ✅ **El orden de los archivos DENTRO de cada carpeta no importa.**
>
> Durante un tiempo anoté acá que había que correr varias carpetas "dos veces"
> porque unas funciones llaman a otras y el orden alfabético no siempre ayuda.
> **Era un consejo innecesario y lo corrijo.**
>
> plpgsql **no valida las llamadas a otras funciones al crearlas**, igual que
> tampoco valida las referencias a tablas: guarda el cuerpo como texto y resuelve
> los nombres recién al ejecutarlo. Así que `cxp_registrar_abono` se crea sin
> problema aunque `cxp_calcular_saldo_proveedor` todavía no exista.
>
> Es el mismo mecanismo que nos jugó en contra con el error
> `relation "caj_caja" does not exist`: las funciones se crearon limpias sobre
> tablas inexistentes y solo fallaron al usarse. Acá juega a favor.
>
> **Con una sola pasada por carpeta basta.**

> ⚠️ **Lo que SÍ importa: el orden ENTRE carpetas, y solo en un caso.**
>
> `gastos-diarios` va **después** de `cuentas-por-pagar`, porque
> `gdo_agregar_linea` llama a `cxp_registrar_cargo` y `gdo_anular_linea` a
> `cxp_anular_movimiento`. Si se corre al revés las funciones se crean igual,
> pero **truenan al ejecutarlas**. Es el enlace que cierra el circuito del cuadre
> diario.
>
> Ningún otro módulo llama a funciones de otro, así que el resto va en cualquier
> orden.

> ⚠️ **`esquema_completo_reejecutable.sql` ya no se edita a mano.** Lo genera
> `utilidades/generar_reejecutable.py` a partir de `database.sql`. Se me estaban
> desincronizando los dos archivos, y la transformación (envolver los
> `ALTER TABLE ... ADD CONSTRAINT` en bloques que ignoran el duplicado) es
> mecánica. Ahora: se edita `database.sql`, se corre el script, listo.

**Sobre `esquema_completo_reejecutable.sql`:** es `database.sql` con una sola diferencia —
las 16 sentencias `ALTER TABLE ... ADD CONSTRAINT` (líneas 261-276 del original) van
envueltas en un bloque que las salta si la constraint ya existe. Eran **lo único** no
idempotente; el resto ya usaba `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`,
`INSERT ... ON CONFLICT` y `CREATE OR REPLACE`. Crea lo que falta, no toca lo que está y
**no borra ni modifica datos**.

### Verificación

```sql
-- 1. ¿Faltan tablas? (debe devolver 0 filas)
--    Ejecutar: front-sistema-inga/public/diagnostico_tablas.sql

-- 2. ¿Están las 15 funciones de personas?
SELECT proname FROM pg_proc WHERE proname LIKE 'cli\_%' ORDER BY proname;

-- 3. ¿Están las 17 funciones de caja?
SELECT proname FROM pg_proc WHERE proname LIKE 'caj\_%' ORDER BY proname;
```

> ⚠️ De las de personas, la que más fácil se pasa por alto es `cli_validar_datos_persona`.
> Sin ella, crear y actualizar personas fallan, porque las dos la llaman.

---

## 2. Bloqueantes heredados del código de Edgardo

**No los he tocado**, porque cambian el comportamiento de módulos que él trabaja ahora.
Está pendiente decidir quién los toma.

1. **Faltan 36 de los 48 permisos en el seed.** `seeds/auth_permisos.sql` solo siembra los
   de usuarios y roles. Los de productos, categorías, subcategorías, almacenes, estaciones
   y sucursales no existen en `auth_permiso`, así que **no se pueden asignar a ningún rol**
   y esos módulos devuelven 403 a todo el que no sea super admin.
   *(Los de personas, convenios y caja sí están, en `seeds/permisos/`.)*

2. **`GET /productos/insumos-procesados` devuelve 400.** Choque de rutas:
   `ProductosController` declara `@Get(':id')` y se registra antes que
   `RecetasProductoController` en `app.module.ts`. La URL entra por `/productos/:id`, el
   `ParseIntPipe` falla.
   **Arreglo:** mover `RecetasProductoModule` antes que `ProductosModule`, o cambiar la
   ruta a `/productos/recetas/insumos-procesados`.

3. **Dos convenciones de banderas mezcladas.** `usuarios.listar` (minúscula con punto) vs
   `ALMACENES_LISTAR` (mayúscula con guion bajo). Todo lo nuestro usa minúsculas con punto,
   que es la que está realmente sembrada.

4. **Subcategorías usa las banderas de categorías.** Las `SUBCATEGORIAS_*` están definidas
   pero nunca se usan.

5. **Recetas y adicionales no tienen banderas propias.** Borrar una receta solo exige
   `PRODUCTOS_EDITAR`.

6. **`PermisosGuard` es código muerto** y tiene 4 `console.log` que imprimen el usuario
   completo en consola. La lógica real vive en `JwtAuthGuard`.

7. **Faltan `RoleGuard` en 8 páginas** del front. Las nuestras (personas, convenios, caja)
   sí lo tienen.

8. **`verifyAccess()` no se usa** y, tal como está, cierra la sesión completa en vez de
   negar solo esa pantalla.

9. **`RoleGuard` renderiza y luego redirige** (parpadeo del contenido protegido) y lee los
   permisos de `localStorage`, así que un permiso revocado sigue vigente hasta el próximo
   login.

10. **No hay refresh token.** Al expirar el JWT el usuario es deslogueado sin aviso.

11. **El `TransformResponseInterceptor` envuelve dos veces sin avisar.** Detecta si la
    respuesta "ya es una ApiResponse" mirando si tiene `success`, `message` y `data`. Si un
    `logic` devuelve `{ data, meta }` a mano, lo envuelve otra vez y la carga queda anidada:
    `{ success, message, data: { data: [...], meta } }`. No lanza error. **Ya causó un bug
    real** (sección 3).

12. **Carpetas muertas por borrar** (quedaron por decisión tuya):
    `api-sistema-inga/src/modules/usuarios-roles/` (6 archivos de 0 bytes),
    `front-sistema-inga/src/services/` (cliente HTTP duplicado),
    `front-sistema-inga/src/lib/` (`api/` y `utils/` vacías).

---

## 3. Bugs que introduje y ya corregí

### `sucursales.map is not a function`

**Causa:** `SucursalesLogic.listar` y `UsuariosLogic.listar` eran los dos únicos `logic`
que armaban la respuesta a mano (`{ data, meta }`) en vez de usar `mapListResult`. Sin
`success` ni `message`, el interceptor las envolvía otra vez.

El bloque defensivo que Edgardo tenía en los servicios del front —el que leía la respuesta
de cinco formas distintas— tapaba justamente esto. Al limpiarlo para dejar un contrato
único, el defecto quedó expuesto.

**Arreglo:** los dos `logic` ahora usan `mapListResult`.

**Lección:** cuando un servicio del front necesita defensas para leer una respuesta, casi
siempre el problema está en el backend. Revisar qué shape devuelve cada endpoint antes de
limpiar defensas.

### Submenús del sidebar que no se podían abrir

**Causa:** el `useEffect` que auto-abre el submenú de la ruta dependía de
`filteredNavItems`, un array nuevo en cada render. El efecto corría siempre y reabría el
submenú de la ruta actual cada vez que el usuario abría otro.

**Arreglo:** ahora depende solo de `pathname`.
**Cuidado:** no agregar arrays calculados en el cuerpo del componente a esa lista de deps.

---

## 4. Pendientes de nuestros módulos terminados

### M05 — Personas
- **Selector de distrito:** el backend acepta y valida `id_distrito`, pero el formulario no
  lo muestra. `gen_departamento`, `gen_provincia` y `gen_distrito` **están vacías** (el seed
  solo carga 'Perú'). Para activarlo hay que cargar el catálogo UBIGEO (~1,800 distritos).
- **`cli_persona_direccion` sin implementar.** El alcance dice "preparadas para delivery
  futuro", así que está bien dejarlo.
- **El listado no muestra el saldo de crédito.** Se devuelve solo en el detalle y en el
  buscador; calcularlo por fila sería una subconsulta por persona.

### M06 — Convenios
- **Falta la alerta de límite de crédito** (ítem del alcance). Se aplica en el cobro (M12).
- **Pendiente tuyo:** condiciones "para fin de mes" y "para quincena de este mes".
  Hoy `gen_condicion_pago` solo tiene `dias_credito` (entero), que expresa "a N días del
  consumo" pero **no** "vence el último día del mes". Hace falta una columna
  `tipo_vencimiento`: 1 CONTADO, 2 DIAS, 3 FIN_MES, 4 QUINCENA.
  Hoy `dias_credito` es **solo informativo**: nada calcula todavía, porque quien calcula
  es M13 (CxC) y aún no existe.

### M08 — Turnos de caja
- **Los totales de venta salen en 0** hasta que exista M12. Leen `ven_pago`, que no tiene
  datos. El cálculo ya está bien escrito.
- 🆕 **Falta `medio_pago` en `caj_movimiento`** (requerimiento de la Reunión 2). Hoy asume
  que todo egreso es en efectivo. **Es cambio de esquema.**
- **La autorización del movimiento es opcional.** El alcance dice "cada movimiento requiere
  autorización". Pendiente confirmar si debe ser obligatoria.
- **Sin cierre automático de turnos olvidados.** Si un cajero no cierra, el turno queda
  abierto y bloquea la caja.
- **El arqueo asume soles.** Denominaciones fijas en `DENOMINACIONES_SOLES`.

### Sidebar
- **`max-h-40` fijo en el contenedor del submenú.** Con 3 ítems va justo; **a partir del
  cuarto se cortan**. Los submenús actuales (Productos, Personas, Caja) tienen 3, 2 y 3.
  Al agregar el de Salón o Almacén, subirlo a `max-h-96`.

---

## 5. Decisiones tomadas — no revertir sin pensarlo

- **Toda la regla de negocio vive en las funciones SQL**, no en el `logic` de Nest. Es el
  patrón que ya traía el proyecto. La capa `logic` solo orquesta y traduce errores a HTTP.

- **Nada de Supabase.** Solo funciones plpgsql + NestJS. La única mención a Supabase en el
  repo es un comentario en `env.validation.ts` sobre dónde puede estar hospedado Postgres.

- **Un archivo de seed de permisos por módulo** (`seeds/permisos/*.sql`). Evita el conflicto
  de merge permanente y hace imposible olvidarse de sembrar los permisos de un módulo nuevo.

- **Los módulos nuevos se registran al final de `app.module.ts`**, para que agregar uno sea
  añadir una línea abajo.

- **En `cli_actualizar_persona` valido la mezcla, no lo que llega.** Primero leo la fila
  actual, la combino con los parámetros nuevos y recién ahí valido. Si validara solo lo
  recibido, se podría dejar una empresa sin razón social mandando un único campo.

- **`quitar_convenio` es una bandera aparte** porque mandar `id_convenio` en null significa
  "no lo estoy cambiando", no "quítalo".

- **El arqueo reemplaza, no acumula.** El cajero cuenta, se equivoca y recuenta; si fuera
  acumulativo, cada recuento sumaría sobre el anterior.

- **`monto_cierre_sistema` se calcula en el backend al cerrar.** Nunca se acepta del front.

- **`monto_diferencia` = `sistema − declarado`**, con signo: **positiva = FALTANTE**,
  negativa = sobrante. Tomado del resumen funcional. **Es contraintuitivo** (en contabilidad
  lo habitual es `real − esperado`). Si se decide invertirlo, hay que tocar cuatro sitios:
  `caj_cerrar_turno.sql`, `cierre-turno-modal.tsx`, `turno-detalle-modal.tsx`,
  `turnos-view.tsx`.

- **Al cajón de caja solo entra EFECTIVO.** `efectivo_esperado = apertura + ventas en
  efectivo + ingresos − egresos`. Yape, tarjeta y crédito se muestran en el resumen pero no
  suman al efectivo esperado. Centralizado en `caj_calcular_totales_turno`.

- **El contrato de la API del front es `{ success, message, data, meta }`**, sin formatos
  alternativos.

- **Rutas literales antes que las de `:id`** en todos los controladores nuestros, con
  comentario explicando por qué. Es el bug #2 de la sección 2.

---

## 6. Próximos pasos

Ver [`progreso.md`](./progreso.md) §4 para el reparto completo. En resumen, el orden
acordado para avanzar sin chocar con Edgardo:

1. **M17 — Planilla** (el más aislado)
2. **M16 — Gastos Administrativos**
3. **M15 — CxP Proveedores** (personas ya está al 100%)
4. **M14 — Gastos Diarios Operativos**

**Antes de empezar conviene agrupar los cambios de esquema** en una sola migración en vez
de tocar la BD módulo por módulo. La lista está en `progreso.md` §3.

Las decisiones pendientes del cliente están en `progreso.md` §6.
