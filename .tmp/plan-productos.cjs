const fs=require('node:fs');const edit=(f,fn)=>fs.writeFileSync(f,fn(fs.readFileSync(f,'utf8')));
edit('src/modules/productos/types/productos.types.ts',s=>s.replace('export type ProductoFormValues = {','export type ProductoFormValues = {\n  stock_inicial?: number;\n  stock_minimo?: number;\n  costo_inicial?: number;'));
edit('src/modules/productos/services/productos.service.ts',s=>s.replace('  const response = await apiPatch<ProductoItem>(`/productos/${id}`, {\n    ...values,','  const { stock_inicial, stock_minimo, costo_inicial, ...editable } = values;\n  const response = await apiPatch<ProductoItem>(`/productos/${id}`, {\n    ...editable,'));
edit('src/modules/productos/components/producto-form-modal.tsx',s=>{
 s=s.replace('import { useCatalogo } from "@/shared/hooks/useCatalogo";','import { ListaSelect, LISTA_IDS } from "@/modules/listas";\nimport { useProductoCatalogos } from "../hooks/use-producto-catalogos";');
 s=s.replace(/  const \{ opciones: tiposProductoBD, isLoading: isLoadingTipos \} = useCatalogo\("PRODUCTO_TIPO"\);/,'');
 for(const name of ['unidades','categorias','subcategorias','almacenes','estaciones'])s=s.replace('  '+name+' = [],\n','');
 s=s.replace('  const [selectedFile,',`  const cat = useProductoCatalogos(isOpen,selectedCategoriaId);
  const unidades=cat.unidades.options,categorias=cat.categorias.options,subcategorias=cat.subcategorias.options,
    almacenes=cat.almacenes.options,estaciones=cat.estaciones.options;
  const [selectedFile,`);
 s=s.replace('const requiereAlmacen = esInsumo || tipo === 6 || values.controla_stock;','const requiereAlmacen = esInsumo || esPlatoOTrago || tipo === 6 || values.controla_stock;');
 s=s.replace('const defaultTipo = tiposProductoBD[0]?.valor_entero ?? 3;','const defaultTipo = 3;');
 s=s.replace('controla_stock: [1, 2, 6].includes(defaultTipo)','controla_stock: true');
 s=s.replace('controla_stock: isIns || numTipo === 6','controla_stock: numTipo >= 1 && numTipo <= 6');
 s=s.replace('id_almacen_stock: isIns || numTipo === 6 ? p.id_almacen_stock || (almacenes[0]?.id ?? null) : null,','id_almacen_stock: numTipo<=6 ? p.id_almacen_stock : null,\n      stock_inicial:0,');
 s=s.replace('          controla_stock: false,\n          disponible_venta: Boolean(raw.disponible_venta),\n          id_almacen_stock: null,\n          id_estacion: raw.id_estacion','          controla_stock: true,\n          stock_inicial:0,\n          disponible_venta: Boolean(raw.disponible_venta),\n          id_almacen_stock: raw.id_almacen_stock,\n          id_estacion: raw.id_estacion');
 s=s.replace('  const tipoProductoOptions = tiposProductoBD.map((t) => ({ value: String(t.valor_entero), label: t.nombre }));','');
 s=s.replace('<Select\n              options={tipoProductoOptions}', '<ListaSelect\n              idLista={LISTA_IDS.PRODUCTO_TIPO}');
 s=s.replace('placeholder={isLoadingTipos ? "Cargando..." : "Seleccione tipo..."}','placeholder="Seleccione tipo..."');
 for(const [option,key] of [['categoria','categorias'],['subcategoria','subcategorias'],['unidad','unidades'],['almacen','almacenes'],['estacion','estaciones']]) {
 s=s.replace('options={'+option+'Options}', 'options={'+option+'Options} onOpen={()=>void cat.'+key+'.load()} isLoading={cat.'+key+'.isLoading} loadError={cat.'+key+'.error}');
 }
 s=s.replace('const subFilt = catId ? subcategorias.filter((s) => s.id_categoria === catId) : [];','');
 s=s.replace('id_subcategoria: subFilt[0]?.id ?? 0','id_subcategoria: 0');
 const a=s.indexOf('  const almacenesFiltrados = almacenes.filter('),b=s.indexOf('  const almacenOptions',a);
 if(a>=0)s=s.slice(0,a)+'  const almacenesFiltrados = almacenes;\n\n'+s.slice(b);
 s=s.replace('        {requiereEstacion && (',`        {!producto && values.controla_stock && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><Label>Stock mínimo</Label><Input type="number" min="0" step={0.0001} value={values.stock_minimo??0}
              onChange={e=>setValues(p=>({...p,stock_minimo:Number(e.target.value)}))}/></div>
            {!esPlatoOTrago && <>
              <div><Label>Stock inicial</Label><Input type="number" min="0" step={0.0001} value={values.stock_inicial??0}
                onChange={e=>setValues(p=>({...p,stock_inicial:Number(e.target.value)}))}/></div>
              <div><Label>Costo por unidad (S/)</Label><Input type="number" min="0" step={0.0001} value={values.costo_inicial??0}
                onChange={e=>setValues(p=>({...p,costo_inicial:Number(e.target.value)}))}/></div>
            </>}
            {esPlatoOTrago && <p className="text-sm text-gray-500 sm:col-span-2">Registra las porciones desde Preparaciones para descontar sus ingredientes.</p>}
          </div>
        )}
        {requiereEstacion && (`);
 return s;
});
edit('src/modules/productos/hooks/use-productos.ts',s=>s.replace('    void loadCatalogosAuxiliares();','')
 .replaceAll('    await loadCatalogosAuxiliares();\n    setIsFormOpen(true);','    setIsFormOpen(true);')
 .replace('  async function openRecetasModal(producto: ProductoItem) {','  async function openRecetasModal(producto: ProductoItem) {\n    await loadCatalogosAuxiliares();')
 .replace('    openCreateModal,','    openCreateModal,\n    loadCatalogosAuxiliares,'));
edit('src/modules/productos/components/productos-view.tsx',s=>s.replace('    openCreateModal,','    openCreateModal, loadCatalogosAuxiliares,')
 .replace(/options=\{(categoriaOptions|subcategoriaOptions)\}/g,'options={$1} onOpen={()=>void loadCatalogosAuxiliares()}'));
