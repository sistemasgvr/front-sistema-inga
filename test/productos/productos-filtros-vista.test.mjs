import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const vista = leer('../../src/modules/productos/components/productos-view.tsx');
const hook = leer('../../src/modules/productos/hooks/use-productos.ts');
const receta = leer('../../src/modules/recetas/components/receta-form-modal.tsx');

test('la tabla ofrece búsqueda, tipo, categoría y subcategoría', () => {
  assert.match(vista, /placeholder="Categoría\.\.\."/);
  assert.match(vista, /placeholder="Subcategoría\.\.\."/);
  assert.match(vista, /placeholder="Tipo producto\.\.\."/);
});

test('los cuatro campos comparten una grilla uniforme', () => {
  assert.match(vista, /grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4/);
});

test('el "+" crea un tipo de producto y abre su formulario', () => {
  assert.match(vista, /title="Crear un tipo de producto"/);
  assert.match(vista, /setIsTipoModalOpen\(true\)/);
  assert.match(vista, /<TipoProductoFormModal/);
});

test('al crear un tipo, se recarga el catálogo y queda seleccionado', () => {
  const bloque = vista.slice(
    vista.indexOf('<TipoProductoFormModal'),
    vista.indexOf('<ConfirmDialog')
  );
  assert.match(bloque, /void tipos\.load\(\)/);
  assert.match(bloque, /handleFilterTipo\(nuevo\.id\)/);
});

test('el backend recibe categoría y subcategoría', () => {
  assert.match(hook, /id_categoria: categoriaFiltro/);
  assert.match(hook, /id_subcategoria: subcategoriaFiltro/);
});

test('cambiar de categoría limpia la subcategoría y vuelve a página 1', () => {
  // Conservarla mostraría filas del contexto anterior.
  assert.match(
    hook,
    /function handleFilterCategoria\(id: number \| undefined\) \{[\s\S]*?setCategoriaFiltro\(id\);\s*setSubcategoriaFiltro\(undefined\);\s*setPagina\(1\);/
  );
});

test('las subcategorías se acotan a la categoría elegida', () => {
  assert.match(vista, /!categoriaFiltro \|\| s\.id_categoria === categoriaFiltro/);
  // Elegir una que la consulta descartaría sería confuso.
});

test('subcategoría deshabilitada sin categoría', () => {
  assert.match(vista, /disabled=\{!categoriaFiltro\}/);
});

test('los filtros de la vista se resetean al cambiar de página base', () => {
  // handleFilterTipo reemplaza al anterior, que solo fijaba la página.
  assert.match(hook, /function handleFilterTipo[\s\S]*?setTipoFiltro\(id\);\s*setPagina\(1\);/);
});

test('el recetario ya no tiene botón de alta de producto', () => {
  // El "+" del recetario es el de "Agregar insumo", que sí debe seguir ahí.
  assert.doesNotMatch(receta, /onRequestCreateProduct/);
  assert.doesNotMatch(receta, /Crear un tipo de producto/);
  assert.doesNotMatch(vista, /onRequestCreateProduct/);
  assert.match(receta, /startIcon=\{<Icon name="mdi:plus"/);
});