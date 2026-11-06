import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function almacen(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => datos.set(clave, valor),
    removeItem: (clave) => datos.delete(clave),
  };
}

/** Carga auth.service.ts con la API y los almacenes simulados. */
function cargarServicio({ apiGet, apiPost, local = {}, sesion = {} }) {
  const source = leer('../../src/modules/auth/services/auth.service.ts');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localStorage = almacen(local);
  const sessionStorage = almacen(sesion);
  const compiled = { exports: {} };
  const require = (ruta) => {
    if (ruta.endsWith('api-client')) return { ApiError, apiGet, apiPost };
    if (ruta.endsWith('use-estado-persistente')) return { limpiarEstadosPersistentes() {} };
    throw new Error(`Módulo no simulado: ${ruta}`);
  };
  vm.runInNewContext(code, {
    module: compiled,
    exports: compiled.exports,
    require,
    window: { location: {} },
    localStorage,
    sessionStorage,
  });
  return { servicio: compiled.exports, localStorage, sessionStorage };
}

const guardado = JSON.stringify({ token: 't', user: { id: 7, username: 'caja' } });

test('sin conexión, getMe conserva el usuario guardado y no invalida la sesión', async () => {
  const { servicio } = cargarServicio({
    apiGet: async () => { throw new ApiError('No se pudo conectar', 0); },
    local: { auth: guardado },
  });
  assert.equal((await servicio.getMe())?.id, 7);
  assert.equal(await servicio.comprobarSesion(), 'sin-conexion');
});

test('un error 500 del backend tampoco invalida la sesión', async () => {
  const { servicio } = cargarServicio({
    apiGet: async () => { throw new ApiError('Error interno', 500); },
    sesion: { auth: guardado },
  });
  assert.equal((await servicio.getMe())?.id, 7);
  assert.equal(await servicio.comprobarSesion(), 'sin-conexion');
});

test('un 401 sí invalida la sesión', async () => {
  const { servicio } = cargarServicio({
    apiGet: async () => { throw new ApiError('Sesión inválida', 401); },
    local: { auth: guardado },
  });
  assert.equal(await servicio.getMe(), null);
  assert.equal(await servicio.comprobarSesion(), 'invalida');
});

test('con respuesta correcta la sesión es válida', async () => {
  const { servicio } = cargarServicio({
    apiGet: async () => ({ id: 7, id_empresa: 1, sucursales: [], id_sucursal: 2 }),
    local: { auth: guardado },
  });
  assert.equal(await servicio.comprobarSesion(), 'valida');
});

test('login envía rememberMe y con Recordarme guarda en localStorage', async () => {
  let cuerpo;
  const { servicio, localStorage, sessionStorage } = cargarServicio({
    apiPost: async (_url, body) => { cuerpo = body; return { token: 'nuevo', usuario: { id: 1 } }; },
  });
  await servicio.login({ email: 'a@b.pe', password: '123456', rememberMe: true });
  assert.equal(cuerpo.rememberMe, true);
  assert.match(localStorage.getItem('auth'), /nuevo/);
  assert.equal(sessionStorage.getItem('auth'), null);
});

test('login sin Recordarme no deja que una sesión vieja de localStorage tape la nueva', async () => {
  const { servicio, localStorage } = cargarServicio({
    apiPost: async () => ({ token: 'nuevo', usuario: { id: 1 } }),
    local: { auth: guardado },
  });
  await servicio.login({ email: 'a@b.pe', password: '123456', rememberMe: false });
  assert.equal(localStorage.getItem('auth'), null);
  assert.equal(servicio.getStoredToken(), 'nuevo');
});

test('la pantalla de login entra directo si ya hay sesión guardada', () => {
  const hook = leer('../../src/modules/auth/hooks/use-login.ts');
  assert.match(hook, /getStoredToken\(\)[\s\S]*router\.replace\("\/dashboard"\)/);
});

test('RequireAuth no borra la sesión por un fallo de red y oculta la vista sin token', () => {
  const guard = leer('../../src/modules/auth/components/require-auth.tsx');
  assert.match(guard, /comprobarSesion\(\)/);
  assert.match(guard, /estado === "invalida"/);
  assert.match(guard, /if \(!conSesion\) return null/);
  assert.doesNotMatch(guard, /catch/);
});
