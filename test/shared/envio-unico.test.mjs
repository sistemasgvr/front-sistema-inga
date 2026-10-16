import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const source = leer('../../src/shared/utils/envio-unico.ts');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const { crearEnvioUnico } = compiled.exports;

const formModal = leer('../../src/components/ui/modal/FormModal.tsx');
const confirmDialog = leer('../../src/components/ui/modal/ConfirmDialog.tsx');
const hook = leer('../../src/shared/hooks/use-envio-unico.ts');
const lineaModal = leer('../../src/modules/gastos-diarios/components/linea-form-modal.tsx');

/** Petición simulada que no responde hasta que el test la resuelve o rechaza. */
function peticionPendiente() {
  let llamadas = 0;
  let resolver;
  let rechazar;
  const enviar = () => {
    llamadas++;
    return new Promise((res, rej) => { resolver = res; rechazar = rej; });
  };
  return { enviar, llamadas: () => llamadas, resolver: (v) => resolver(v), rechazar: (e) => rechazar(e) };
}

/** Reproduce el handleSubmit de FormModal: preventDefault, descarta si está ocupado y delega en la guardia. */
function crearFormulario(onSubmit, { isSaving = () => false } = {}) {
  const guardia = crearEnvioUnico();
  let prevenidos = 0;
  const submit = () => {
    const evento = { preventDefault: () => { prevenidos++; }, stopPropagation() {} };
    evento.preventDefault();
    if (isSaving()) return undefined;
    return guardia.ejecutar(() => onSubmit(evento));
  };
  return { submit, guardia, prevenidos: () => prevenidos };
}

test('dos submits en el mismo tick disparan una sola petición', async () => {
  const peticion = peticionPendiente();
  const form = crearFormulario(() => peticion.enviar());

  const primero = form.submit();
  const segundo = form.submit();

  assert.equal(peticion.llamadas(), 1);
  assert.equal(await segundo, undefined);
  assert.equal(form.prevenidos(), 2, 'el submit descartado también cancela el envío nativo');

  peticion.resolver('ok');
  assert.equal(await primero, 'ok');
});

test('seis clics en "Guardar" mientras responde el backend registran una sola compra', async () => {
  const peticion = peticionPendiente();
  const form = crearFormulario(async () => { await peticion.enviar(); });

  const envios = Array.from({ length: 6 }, () => form.submit());
  // También después de varios ticks, mientras la primera sigue en curso.
  await Promise.resolve();
  envios.push(form.submit());

  assert.equal(peticion.llamadas(), 1);
  assert.equal(form.guardia.enCurso, true);
  peticion.resolver();
  await Promise.all(envios);
  assert.equal(form.guardia.enCurso, false);
});

test('se libera al responder con éxito y permite un nuevo envío', async () => {
  const peticion = peticionPendiente();
  const form = crearFormulario(() => peticion.enviar());

  const primero = form.submit();
  peticion.resolver();
  await primero;

  const segundo = form.submit();
  assert.equal(peticion.llamadas(), 2);
  peticion.resolver();
  await segundo;
});

test('se libera también cuando el backend responde con error', async () => {
  const peticion = peticionPendiente();
  const form = crearFormulario(() => peticion.enviar());

  const primero = form.submit();
  peticion.rechazar(new Error('500'));
  await assert.rejects(primero, /500/);
  assert.equal(form.guardia.enCurso, false);

  const segundo = form.submit();
  assert.equal(peticion.llamadas(), 2);
  peticion.resolver();
  await segundo;
});

test('notifica el inicio y el fin para mostrar la carga en el botón', async () => {
  const cambios = [];
  const guardia = crearEnvioUnico((enCurso) => cambios.push(enCurso));
  const peticion = peticionPendiente();

  const envio = guardia.ejecutar(() => peticion.enviar());
  guardia.ejecutar(() => peticion.enviar());
  assert.deepEqual(cambios, [true]);
  peticion.resolver();
  await envio;
  assert.deepEqual(cambios, [true, false]);
});

test('con isSaving del padre activo el submit se descarta sin llamar a onSubmit', async () => {
  let llamadas = 0;
  const form = crearFormulario(async () => { llamadas++; }, { isSaving: () => true });
  await form.submit();
  assert.equal(llamadas, 0);
  assert.equal(form.prevenidos(), 1);
});

test('el hook guarda la guardia entre renders y expone el estado "enviando"', () => {
  assert.match(hook, /useState\(\(\) => crearEnvioUnico\(setEnviando\)\)/);
  assert.match(hook, /return \{ enviando, ejecutar: guardia\.ejecutar \}/);
});

test('FormModal exige la promesa del guardado y protege el botón', () => {
  assert.match(formModal, /onSubmit: \(e: FormEvent\) => Promise<unknown>;/);
  assert.match(formModal, /const \{ enviando, ejecutar \} = useEnvioUnico\(\);/);
  assert.match(formModal, /const ocupado = isSaving \|\| enviando;/);
  assert.match(formModal, /e\.preventDefault\(\);[\s\S]*void ejecutar\(\(\) => onSubmit\(e\)\)/);
  assert.match(formModal, /disabled=\{ocupado \|\| submitDisabled\}/);
  assert.match(formModal, /\{ocupado \? "Guardando\.\.\." : submitText\}/);
  assert.match(formModal, /mdi:loading/);
  assert.match(formModal, /type="button" onClick=\{onClose\} disabled=\{ocupado\}/);
});

test('ConfirmDialog no repite la acción con doble clic', () => {
  assert.match(confirmDialog, /if \(!ocupado\) void ejecutar\(onConfirm\);/);
  assert.match(confirmDialog, /const ocupado = isLoading \|\| enviando;/);
});

test('la compra del día espera la respuesta del backend antes de liberar el modal', () => {
  assert.match(lineaModal, /async function handleSubmit\(event: FormEvent\)/);
  assert.match(lineaModal, /await onSubmit\(values\);/);
});

test('ningún modal de FormModal lanza el guardado sin esperarlo', () => {
  const raiz = fileURLToPath(new URL('../../src', import.meta.url));
  const archivos = [];
  const recorrer = (dir) => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (ruta.endsWith('.tsx')) archivos.push(ruta);
    }
  };
  recorrer(raiz);

  const conFormModal = archivos.filter((ruta) => readFileSync(ruta, 'utf8').includes('<FormModal'));
  assert.ok(conFormModal.length > 30);
  for (const ruta of conFormModal) {
    const contenido = readFileSync(ruta, 'utf8');
    // Un `void guardar()` dentro del submit liberaría el modal antes de la respuesta.
    assert.doesNotMatch(contenido, /void onSubmit\(/, ruta);
    assert.doesNotMatch(contenido, /preventDefault\(\);\s*void /, ruta);
  }
});

test('los modales con botón propio usan la misma guardia', () => {
  for (const ruta of [
    '../../src/modules/roles/components/role-permissions-modal.tsx',
    '../../src/modules/caja/components/abrir-turno-card.tsx',
    '../../src/modules/mesas/components/cierre-pedido.tsx',
    '../../src/modules/recetas/components/receta-form-modal.tsx',
  ]) {
    const contenido = leer(ruta);
    assert.match(contenido, /useEnvioUnico\(\)/, ruta);
    assert.match(contenido, /void ejecutar\(/, ruta);
  }
});
