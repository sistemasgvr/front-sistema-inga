import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Ejecuta los hooks con estado, dependencias y efectos controlados, sin backend ni reloj real.
function runtime() {
  const slots = [], effects = new Map();
  let cursor = 0, dirty = false, component, tree;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    createContext: () => ({ Provider: 'Provider' }),
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: initial, set(next) {
        const value = typeof next === 'function' ? next(slots[i].value) : next;
        if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true; }
      } };
      return [slots[i].value, slots[i].set];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) slots[i] = { deps, fn };
      return slots[i].fn;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) {
        slots[i] = { deps };
        effects.set(i, { fn, cleanup: effects.get(i)?.cleanup, pending: true });
      }
    },
  };
  function flush() {
    do {
      dirty = false;
      cursor = 0;
      tree = component();
      for (const entry of effects.values()) if (entry.pending) {
        entry.pending = false;
        entry.cleanup?.();
        entry.cleanup = entry.fn();
      }
    } while (dirty);
    return tree;
  }
  return {
    react, flush,
    render(fn) { component = fn; return flush(); },
    replayEffects() { for (const e of effects.values()) { e.cleanup?.(); e.cleanup = e.fn(); } },
    unmount() { for (const e of effects.values()) e.cleanup?.(); },
    get tree() { return tree; },
  };
}

function load(file, imports, globals = {}) {
  const source = readFileSync(new URL(`../../src/${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    exports: module.exports, module,
    require(id) { if (!(id in imports)) throw new Error(`Unexpected import: ${id}`); return imports[id]; },
    ...globals,
  });
  return module.exports;
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children), ...elements(node.content)];
}

function provider() {
  const r = runtime(), timers = new Map(), body = { name: 'document.body' };
  let now = 0, nextTimer = 0;
  const { ToastProvider } = load('components/ui/toast/ToastContext.tsx', {
    react: r.react,
    'react-dom': { createPortal: (content, target) => ({ content, target }) },
    '@/components/ui/icon': { Icon: 'Icon' },
  }, {
    document: { body }, Date: { now: () => now },
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  r.render(() => ToastProvider({ children: 'Contenido de la página' }));
  return {
    r, timers, body,
    emit(...args) { r.tree.props.value.toast(...args); r.flush(); },
    cards() { return elements(r.tree).filter(n => ['alert', 'status'].includes(n.props?.role)); },
    advance(ms) {
      const target = now + ms;
      while (true) {
        const due = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        now = due[1].at; timers.delete(due[0]); due[1].fn(); r.flush();
      }
      now = target;
    },
  };
}

test('agrupa el error recibido simultáneamente por pantalla y formulario', () => {
  const p = provider();
  p.emit('error', 'Error al guardar', 'Documento duplicado');
  p.emit('error', 'Atención', 'Documento duplicado');
  assert.equal(p.cards().length, 1);
  assert.equal(p.timers.size, 1);
  p.advance(1000);
  p.emit('error', 'Error al guardar', 'Documento duplicado');
  assert.equal(p.cards().length, 2, 'un nuevo intento vuelve a notificar');
  p.r.unmount();
});

test('la cola no pierde el cuarto aviso ni lo expira mientras espera', () => {
  const p = provider();
  for (let i = 1; i <= 4; i++) p.emit('success', 'Guardado', `Operación ${i}`);
  assert.equal(p.cards().length, 3);
  assert.equal(p.timers.size, 3);
  p.advance(5000);
  assert.equal(p.cards().length, 1);
  assert.match(JSON.stringify(p.cards()), /Operación 4/);
  p.advance(4999);
  assert.equal(p.cards().length, 1);
  p.advance(1);
  assert.equal(p.cards().length, 0);
});

test('los errores duran ocho segundos y el cierre manual cancela su temporizador', () => {
  const p = provider();
  p.emit('error', 'Error', 'No se pudo conectar');
  p.advance(7999);
  assert.equal(p.cards().length, 1);
  p.advance(1);
  assert.equal(p.cards().length, 0);
  p.emit('warning', 'Atención', 'Revisar datos');
  const close = elements(p.cards()).find(n => n.type === 'button');
  assert.match(close.props['aria-label'], /Cerrar notificación/);
  close.props.onClick(); p.r.flush();
  assert.equal(p.cards().length, 0);
  assert.equal(p.timers.size, 0);
});

test('los avisos usan el portal global y al desmontar se limpian los temporizadores', () => {
  const p = provider();
  p.emit('info', 'Información', 'Operación completada');
  assert.equal(p.r.tree.props.children[0], 'Contenido de la página');
  assert.ok(elements(p.r.tree).some(n => n.target === p.body));
  p.r.unmount();
  assert.equal(p.timers.size, 0);
});

test('feedback notifica nuevos eventos iguales pero no repite por render o Strict Mode', () => {
  const r = runtime(), calls = [];
  const toast = (...args) => calls.push(args);
  const { useFeedback } = load('shared/hooks/use-feedback.ts', {
    react: r.react, '@/components/ui/toast/ToastContext': { useToast: () => ({ toast }) },
  });
  r.render(() => useFeedback(null));
  const setter = r.tree[1];
  setter({ variant: 'success', title: 'Guardado', message: 'Cambios guardados' }); r.flush();
  r.flush(); r.replayEffects();
  assert.equal(calls.length, 1);
  setter({ variant: 'success', title: 'Guardado', message: 'Cambios guardados' }); r.flush();
  assert.equal(calls.length, 2);
  setter(previous => previous); r.flush();
  setter(null); r.flush();
  assert.equal(calls.length, 2);
  assert.equal(r.tree[0], null);
  assert.equal(r.tree[1], setter);
});

test('el adaptador de props no ocupa espacio ni notifica nuevamente en cada render', () => {
  const r = runtime(), calls = [];
  const toast = (...args) => calls.push(args);
  const { ToastNotification } = load('components/ui/toast/ToastNotification.tsx', {
    react: r.react, './ToastContext': { useToast: () => ({ toast }) },
  });
  let message = 'No se pudo cargar';
  r.render(() => ToastNotification({ variant: 'error', title: 'Error', message }));
  assert.equal(r.tree, null);
  r.flush(); r.replayEffects();
  assert.equal(calls.length, 1);
  message = 'Sesión expirada'; r.flush();
  assert.equal(calls.length, 2);
});

test('cada intento de formulario puede emitir el mismo error sin depender de un cambio de estado', () => {
  const r = runtime(), calls = [];
  const toast = (...args) => calls.push(args);
  const { useErrorNotification } = load('shared/hooks/use-error-notification.ts', {
    react: r.react, '@/components/ui/toast/ToastContext': { useToast: () => ({ toast }) },
  });
  r.render(() => useErrorNotification('Error al guardar'));
  const notify = r.tree;
  notify('Documento inválido'); notify('Documento inválido');
  assert.equal(calls.length, 2);
  r.flush();
  assert.equal(r.tree, notify);
});

test('la campana solo navega a rutas internas de la app', () => {
  const { esRutaInterna, normalizarNotificacion } = load('modules/notificaciones/utils/notificaciones.utils.ts', {});
  assert.equal(esRutaInterna('/ventas?venta=12'), true);
  assert.equal(esRutaInterna('/productos/stock?estado=alertas&buscar=Pollo%20%26%20papas'), true);
  for (const ruta of ['https://malicioso.com', '//malicioso.com', 'javascript:alert(1)', '/a b', 12, null]) {
    assert.equal(esRutaInterna(ruta), false, String(ruta));
  }
  assert.equal(normalizarNotificacion({ id: 'x', ruta: 'https://otro.com' }), null);
  const n = normalizarNotificacion({ id: 'x', ruta: '/caja/turnos?turno=3', severidad: 'rara', idReferencia: 3 });
  assert.equal(n.severidad, 'info');
  assert.equal(n.leida, false);
  assert.equal(n.idReferencia, 3);
});

test('el tiempo relativo de las notificaciones es legible', () => {
  const { tiempoRelativo } = load('modules/notificaciones/utils/notificaciones.utils.ts', {});
  const ahora = new Date(2026, 9, 22, 12, 0).getTime();
  const hace = (min) => new Date(ahora - min * 60_000).toISOString();
  assert.equal(tiempoRelativo(hace(0), ahora), 'hace un momento');
  assert.equal(tiempoRelativo(hace(5), ahora), 'hace 5 min');
  assert.equal(tiempoRelativo(hace(180), ahora), 'hace 3 h');
  assert.equal(tiempoRelativo(hace(60 * 30), ahora), 'ayer');
  assert.equal(tiempoRelativo(hace(60 * 24 * 3), ahora), 'hace 3 días');
  assert.equal(tiempoRelativo(new Date(2026, 8, 1, 9).toISOString(), ahora), '01/09/2026');
  assert.equal(tiempoRelativo('no es fecha', ahora), '');
});
