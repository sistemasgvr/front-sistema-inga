"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import {
  DIAS_SEMANA,
  MESES,
  RANGO_VACIO,
  aYmd,
  compararDia,
  cursorParaRangoEnmascarado,
  decadaDe,
  desdeYmd,
  diasDelMes,
  enmascararRango,
  enmascararSegmento,
  esHoy,
  formatearDdMmYyyy,
  formatearRango,
  hoyIso,
  indiceDigitoEnCursor,
  limitesSeparador,
  mismoDia,
  parsearDdMmYyyy,
  parsearLimite,
  rangoDesdeFechas,
  rangoDesdeTexto,
  segmentosDe,
  segmentoParaNavegacion,
  type RangoFechas,
} from "@/shared/utils/fecha";

type Vista = "dia" | "mes" | "anio";

/** Puente visual entre celdas para dibujar el rango sobre la grilla. */
type Puente = "entre" | "inicio" | "fin" | null;

type RolDia =
  | "inicio"
  | "fin"
  | "simple"
  | "entre"
  | "parcial"
  | "hoy"
  | "inhabilitado"
  | "normal";

export type DateRangePickerProps = {
  /** Rango vigente en ISO corto (`YYYY-MM-DD`). */
  value?: RangoFechas;
  onChange: (rango: RangoFechas) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  /** Límites en ISO corto o `dd/mm/aaaa`. */
  min?: string;
  max?: string;
  id?: string;
  name?: string;
  className?: string;
  /**
   * Una sola fecha: el texto es `dd/mm/aaaa`, el rango queda con
   * `desde = hasta` y elegir un día cierra el calendario. Ver `DatePicker`.
   */
  unDia?: boolean;
};

const ANCHO_PANEL = 320;
const ALTO_ESTIMADO = 380;
const ANIOS_POR_DECADA = 12;

export function DateRangePicker({
  value = RANGO_VACIO,
  onChange,
  label,
  placeholder,
  hint,
  disabled = false,
  error = false,
  required = false,
  min,
  max,
  id,
  name,
  className = "",
  unDia = false,
}: DateRangePickerProps) {
  const formatear = useCallback(
    (rango: RangoFechas) => (unDia ? formatearDdMmYyyy(rango.desde) : formatearRango(rango)),
    [unDia],
  );
  // En modo de un día el texto es una sola fecha y vale como inicio y fin.
  const leerTexto = useCallback(
    (texto: string) => {
      if (!unDia) return rangoDesdeTexto(texto);
      const dia = parsearDdMmYyyy(enmascararSegmento(texto));
      return { desde: dia, hasta: dia };
    },
    [unDia],
  );

  const [borrador, setBorrador] = useState(() => formatear(value));
  const [enfocado, setEnfocado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<Vista>("dia");
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [inicioDecada, setInicioDecada] = useState(() => decadaDe(new Date().getFullYear()));
  const [estilo, setEstilo] = useState({
    top: "0px",
    left: "0px",
    width: `${ANCHO_PANEL}px`,
  });

  const envoltorioRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const minimo = useMemo(() => parsearLimite(min), [min]);
  const maximo = useMemo(() => parsearLimite(max), [max]);

  // Mientras el campo tiene el foco manda lo que se está escribiendo; si no,
  // el texto vuelve a reflejar el rango que llega desde el estado de la vista.
  const textoDesdeValor = formatear(value);
  const [textoAplicado, setTextoAplicado] = useState(textoDesdeValor);
  if (textoDesdeValor !== textoAplicado) {
    setTextoAplicado(textoDesdeValor);
    if (!enfocado) setBorrador(textoDesdeValor);
  }

  const diaInhabilitado = useCallback(
    (fecha: Date) => {
      if (disabled) return true;
      if (minimo && compararDia(fecha, minimo) < 0) return true;
      return Boolean(maximo && compararDia(fecha, maximo) > 0);
    },
    [disabled, minimo, maximo],
  );

  const mesInhabilitado = useCallback(
    (indice: number) => {
      if (minimo && new Date(anio, indice + 1, 0) < minimo) return true;
      return Boolean(maximo && new Date(anio, indice, 1) > maximo);
    },
    [anio, minimo, maximo],
  );

  const anioInhabilitado = useCallback(
    (candidato: number) => {
      if (minimo && new Date(candidato, 11, 31) < minimo) return true;
      return Boolean(maximo && new Date(candidato, 0, 1) > maximo);
    },
    [minimo, maximo],
  );

  /** Con el panel abierto el calendario sigue al borrador; si no, al modelo. */
  const rangoVisible = useMemo(() => {
    if (!abierto) return { desde: value.desde, hasta: value.hasta };
    const borradorParseado = leerTexto(borrador);
    if (borradorParseado.desde && borradorParseado.hasta) {
      return { desde: aYmd(borradorParseado.desde), hasta: aYmd(borradorParseado.hasta) };
    }
    if (borradorParseado.desde) return { desde: aYmd(borradorParseado.desde), hasta: "" };
    return { desde: value.desde, hasta: value.hasta };
  }, [abierto, borrador, leerTexto, value.desde, value.hasta]);

  const desdeRango = useMemo(() => desdeYmd(rangoVisible.desde), [rangoVisible.desde]);
  const hastaRango = useMemo(() => desdeYmd(rangoVisible.hasta), [rangoVisible.hasta]);

  /** Lleva el texto editado al estado; descarta lo que no sea una fecha válida. */
  const aplicarBorrador = useCallback(() => {
    const { desde: inicio, hasta: fin } = leerTexto(borrador);
    let desde = inicio;
    let hasta = fin;
    if (desde && minimo && compararDia(desde, minimo) < 0) desde = null;
    if (desde && maximo && compararDia(desde, maximo) > 0) desde = null;
    if (hasta && maximo && compararDia(hasta, maximo) > 0) hasta = null;
    if (unDia) {
      // Una fecha sola no se borra escribiendo: el texto inválido vuelve a la vigente.
      if (!desde) {
        setBorrador(formatear(value));
        return;
      }
      hasta = desde;
    }
    const siguiente = rangoDesdeFechas(desde, hasta);
    if (siguiente.desde !== value.desde || siguiente.hasta !== value.hasta) onChange(siguiente);
    setBorrador(formatear(siguiente));
  }, [borrador, formatear, leerTexto, minimo, maximo, onChange, unDia, value]);

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    const abriendo = !abierto;
    if (abriendo) {
      // Un texto válido en el campo debe verse reflejado antes de elegir días.
      aplicarBorrador();
      setVista("dia");
      const delBorrador = leerTexto(borrador);
      const referencia =
        delBorrador.desde ??
        delBorrador.hasta ??
        desdeYmd(value.desde) ??
        desdeYmd(value.hasta) ??
        desdeYmd(hoyIso()) ??
        new Date();
      setMes(referencia.getMonth());
      setAnio(referencia.getFullYear());
      setInicioDecada(decadaDe(referencia.getFullYear()));
    }
    setAbierto(abriendo);
  }, [abierto, aplicarBorrador, borrador, disabled, leerTexto, value.desde, value.hasta]);

  // Posiciona el panel respecto al disparador y lo cierra al pulsar fuera.
  useEffect(() => {
    if (!abierto) return;

    const posicionar = () => {
      const disparador = envoltorioRef.current;
      if (!disparador) return;
      const caja = disparador.getBoundingClientRect();
      const margen = 8;
      const separacion = 4;
      const ancho = Math.min(ANCHO_PANEL, window.innerWidth - margen * 2);
      let left = caja.left;
      if (left + ancho > window.innerWidth - margen) {
        left = Math.max(margen, window.innerWidth - margen - ancho);
      }
      const espacioAbajo = window.innerHeight - caja.bottom - margen;
      const espacioArriba = caja.top - margen;
      const haciaArriba = espacioAbajo < ALTO_ESTIMADO && espacioArriba > espacioAbajo;
      const top = haciaArriba
        ? Math.max(margen, caja.top - separacion - ALTO_ESTIMADO)
        : caja.bottom + separacion;
      setEstilo({ top: `${top}px`, left: `${left}px`, width: `${ancho}px` });
    };

    posicionar();

    const fueraDelCampo = (evento: Event) => {
      const destino = evento.target as Node;
      if (envoltorioRef.current?.contains(destino) || panelRef.current?.contains(destino)) return;
      setAbierto(false);
    };
    const alEscapar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };

    window.addEventListener("resize", posicionar);
    window.addEventListener("scroll", posicionar, true);
    document.addEventListener("mousedown", fueraDelCampo, true);
    document.addEventListener("touchstart", fueraDelCampo, true);
    document.addEventListener("keydown", alEscapar);
    return () => {
      window.removeEventListener("resize", posicionar);
      window.removeEventListener("scroll", posicionar, true);
      document.removeEventListener("mousedown", fueraDelCampo, true);
      document.removeEventListener("touchstart", fueraDelCampo, true);
      document.removeEventListener("keydown", alEscapar);
    };
  }, [abierto]);

  /** Lleva el calendario al segmento del rango que se está editando. */
  function alinearCalendario(texto: string) {
    const [izquierda, derecha] = segmentosDe(texto);
    const pista = segmentoParaNavegacion(derecha) ?? segmentoParaNavegacion(izquierda);
    if (!pista) return;
    const tentativa = new Date(pista.anio, pista.mes, pista.dia);
    if (diaInhabilitado(tentativa)) return;
    setMes(pista.mes);
    setAnio(pista.anio);
    setInicioDecada(decadaDe(pista.anio));
  }

  function alEscribir(evento: React.ChangeEvent<HTMLInputElement>) {
    const campo = evento.target;
    const cursor = campo.selectionStart ?? campo.value.length;
    const digitos = indiceDigitoEnCursor(campo.value, cursor);
    const limites = limitesSeparador(campo.value);
    const despuesDelSeparador = Boolean(limites && cursor >= limites.fin);
    const enmascarado = unDia ? enmascararSegmento(campo.value) : enmascararRango(campo.value);
    setBorrador(enmascarado);
    if (abierto) alinearCalendario(enmascarado);
    const reposicion = cursorParaRangoEnmascarado(enmascarado, digitos, despuesDelSeparador);
    requestAnimationFrame(() => campo.setSelectionRange(reposicion, reposicion));
  }

  function confirmarDesdeTexto() {
    aplicarBorrador();
    setEnfocado(false);
  }

  function seleccionarDia(dia: Date) {
    if (diaInhabilitado(dia)) return;
    if (unDia) {
      const siguiente = rangoDesdeFechas(dia, dia);
      onChange(siguiente);
      setBorrador(formatear(siguiente));
      setAbierto(false);
      return;
    }
    // Sin rango, o con rango ya cerrado, el próximo clic arranca uno nuevo.
    const siguiente = value.desde && !value.hasta ? cerrarRango(value.desde, dia) : rangoDesdeFechas(dia, null);
    onChange(siguiente);
    setBorrador(formatearRango(siguiente));
  }

  function seleccionarMes(indice: number) {
    if (mesInhabilitado(indice)) return;
    setMes(indice);
    setVista("dia");
  }

  function seleccionarAnio(candidato: number) {
    if (anioInhabilitado(candidato)) return;
    setAnio(candidato);
    setInicioDecada(decadaDe(candidato));
    setVista("mes");
  }

  function navegar(paso: -1 | 1) {
    if (vista === "dia") {
      if (mes === 0 && paso === -1) {
        setMes(11);
        setAnio(anio - 1);
      } else if (mes === 11 && paso === 1) {
        setMes(0);
        setAnio(anio + 1);
      } else {
        setMes(mes + paso);
      }
      return;
    }
    if (vista === "mes") {
      setAnio(anio + paso);
      return;
    }
    setInicioDecada(inicioDecada + paso * ANIOS_POR_DECADA);
  }

  function limpiarRango() {
    onChange(RANGO_VACIO);
    setBorrador("");
    setAbierto(false);
  }

  function elegirHoy() {
    const hoy = desdeYmd(hoyIso());
    if (!hoy || diaInhabilitado(hoy)) return;
    const siguiente = rangoDesdeFechas(hoy, hoy);
    onChange(siguiente);
    setBorrador(formatear(siguiente));
    if (unDia) setAbierto(false);
  }

  function puente(dia: Date): Puente {
    if (!desdeRango || !hastaRango || mismoDia(desdeRango, hastaRango)) return null;
    if (compararDia(dia, desdeRango) < 0 || compararDia(dia, hastaRango) > 0) return null;
    if (mismoDia(dia, desdeRango)) return "inicio";
    return mismoDia(dia, hastaRango) ? "fin" : "entre";
  }

  function rolDia(dia: Date): RolDia {
    const libre = (): RolDia =>
      diaInhabilitado(dia) ? "inhabilitado" : esHoy(dia) ? "hoy" : "normal";
    if (!desdeRango) return libre();
    if (!hastaRango) return mismoDia(dia, desdeRango) ? "parcial" : libre();
    if (mismoDia(desdeRango, hastaRango)) return mismoDia(dia, desdeRango) ? "simple" : libre();
    if (mismoDia(dia, desdeRango)) return "inicio";
    if (mismoDia(dia, hastaRango)) return "fin";
    return compararDia(dia, desdeRango) > 0 && compararDia(dia, hastaRango) < 0 ? "entre" : libre();
  }

  const clasesTrigger = disabled
    ? "cursor-not-allowed border-gray-300 bg-gray-100 opacity-60 dark:border-gray-700 dark:bg-gray-800"
    : error
      ? "border-error-500 focus-within:border-error-500 focus-within:ring-error-500/10 dark:border-error-500"
      : "border-gray-300 bg-transparent focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-brand-800";

  const aniosDecada = useMemo(
    () => Array.from({ length: ANIOS_POR_DECADA }, (_, i) => inicioDecada + i),
    [inicioDecada],
  );

  const hoyDeshabilitado = diaInhabilitado(desdeYmd(hoyIso()) ?? new Date());

  const etiquetaAnterior =
    vista === "dia" ? "Mes anterior" : vista === "mes" ? "Año anterior" : "Período anterior";
  const etiquetaSiguiente =
    vista === "dia" ? "Mes siguiente" : vista === "mes" ? "Año siguiente" : "Período siguiente";

  return (
    <div className={`w-full ${className}`}>
      {label &&
        (id ? (
          <label
            htmlFor={id}
            className="mb-1 flex items-center gap-0.5 text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {label}
            {required && <span className="text-brand-500">*</span>}
          </label>
        ) : (
          <span className="mb-1 flex items-center gap-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
            {required && <span className="text-brand-500">*</span>}
          </span>
        ))}

      <div ref={envoltorioRef} className="relative">
        <div
          className={`flex h-11 w-full items-stretch overflow-hidden rounded-lg border shadow-theme-xs transition-colors focus-within:outline-hidden ${clasesTrigger}`}
        >
          <input
            id={id}
            name={name}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={unDia ? 10 : 23}
            value={borrador}
            placeholder={placeholder ?? (unDia ? "dd/mm/aaaa" : "Desde — hasta")}
            disabled={disabled}
            role="combobox"
            aria-expanded={abierto}
            aria-controls={abierto ? "date-range-calendario" : undefined}
            aria-label={label ? undefined : unDia ? "Fecha" : "Rango de fechas"}
            onChange={alEscribir}
            onFocus={() => setEnfocado(true)}
            onBlur={confirmarDesdeTexto}
            onKeyDown={(evento) => {
              if (evento.key === "Enter") {
                evento.preventDefault();
                confirmarDesdeTexto();
              }
            }}
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-hidden placeholder:text-gray-400 focus:ring-0 disabled:cursor-not-allowed dark:text-white/90 dark:placeholder:text-white/30"
          />
          <button
            type="button"
            disabled={disabled}
            aria-label={unDia ? "Abrir calendario" : "Abrir calendario de rango"}
            onClick={toggleOpen}
            className={`flex shrink-0 items-center justify-center border-l border-gray-300 px-3 dark:border-gray-700 ${
              disabled ? "cursor-not-allowed opacity-60" : "hover:bg-gray-50 dark:hover:bg-gray-800/80"
            }`}
          >
            <Icon
              name="mdi:calendar-month-outline"
              size={20}
              className="shrink-0 text-gray-500 dark:text-gray-400"
            />
          </button>
        </div>

        {hint && (
          <p
            className={`mt-1.5 text-xs ${
              error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {hint}
          </p>
        )}
      </div>

      {abierto &&
        createPortal(
          <div
            ref={panelRef}
            id="date-range-calendario"
            role="dialog"
            aria-label={unDia ? "Calendario" : "Calendario de rango"}
            style={estilo}
            className="app-date-range-enter fixed z-99999 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
          >
            {/* Cabecera con el descenso día → mes → década. */}
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 dark:border-gray-700/80">
              <button
                type="button"
                aria-label={etiquetaAnterior}
                onClick={() => navegar(-1)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Icon name="mdi:chevron-left" size={16} />
              </button>

              {vista === "dia" && (
                <button
                  type="button"
                  onClick={() => setVista("mes")}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="capitalize">{MESES[mes].toLowerCase()}</span>
                  <span className="text-brand-600 dark:text-brand-400">{anio}</span>
                  <Icon name="mdi:chevron-down" size={14} className="text-gray-400 dark:text-gray-500" />
                </button>
              )}
              {vista === "mes" && (
                <button
                  type="button"
                  onClick={() => setVista("anio")}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="text-brand-600 dark:text-brand-400">{anio}</span>
                  <Icon name="mdi:chevron-down" size={14} className="text-gray-400 dark:text-gray-500" />
                </button>
              )}
              {vista === "anio" && (
                <span className="px-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {inicioDecada} – {inicioDecada + ANIOS_POR_DECADA - 1}
                </span>
              )}

              <button
                type="button"
                aria-label={etiquetaSiguiente}
                onClick={() => navegar(1)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Icon name="mdi:chevron-right" size={16} />
              </button>
            </div>

            {/* Vista día */}
            {vista === "dia" && (
              <>
                <div className="grid grid-cols-7 gap-1 px-3 pb-1 pt-2.5">
                  {DIAS_SEMANA.map((nombre) => (
                    <span
                      key={nombre}
                      className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      {nombre}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 px-3 pb-2">
                  {diasDelMes(anio, mes).map((dia, indice) => {
                    if (!dia) return <div key={indice} className="h-9" />;
                    const trazo = puente(dia);
                    return (
                      <div key={indice} className="relative flex h-9 w-full items-center justify-center">
                        {trazo === "entre" && (
                          <div className="absolute inset-y-1.5 left-1 right-1 rounded-full bg-brand-100/95 dark:bg-brand-900/45" />
                        )}
                        {trazo === "inicio" && (
                          <div className="absolute inset-y-1.5 left-1/2 right-1 rounded-r-full bg-brand-100/95 dark:bg-brand-900/45" />
                        )}
                        {trazo === "fin" && (
                          <div className="absolute inset-y-1.5 left-1 right-1/2 rounded-l-full bg-brand-100/95 dark:bg-brand-900/45" />
                        )}
                        <button
                          type="button"
                          disabled={diaInhabilitado(dia)}
                          onClick={() => seleccionarDia(dia)}
                          className={`relative z-10 flex items-center justify-center text-sm font-medium transition-colors ${clasesDia(
                            rolDia(dia),
                          )}`}
                        >
                          {dia.getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Vista mes */}
            {vista === "mes" && (
              <div className="grid grid-cols-3 gap-1.5 p-3">
                {MESES.map((nombre, indice) => (
                  <button
                    key={nombre}
                    type="button"
                    disabled={mesInhabilitado(indice)}
                    onClick={() => seleccionarMes(indice)}
                    className={`rounded-lg py-2.5 text-sm font-medium transition-all duration-100 ${
                      mesInhabilitado(indice)
                        ? "cursor-not-allowed text-gray-300 opacity-50 dark:text-gray-600"
                        : mes === indice
                          ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
                    }`}
                  >
                    {nombre.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Vista década */}
            {vista === "anio" && (
              <div className="grid grid-cols-3 gap-1.5 p-3">
                {aniosDecada.map((candidato) => (
                  <button
                    key={candidato}
                    type="button"
                    disabled={anioInhabilitado(candidato)}
                    onClick={() => seleccionarAnio(candidato)}
                    className={`rounded-lg py-2.5 text-sm font-medium transition-all duration-100 ${
                      anioInhabilitado(candidato)
                        ? "cursor-not-allowed text-gray-300 opacity-50 dark:text-gray-600"
                        : anio === candidato
                          ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                          : Number(hoyIso().slice(0, 4)) === candidato
                            ? "ring-1 ring-brand-500 text-brand-700 dark:text-brand-300"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
                    }`}
                  >
                    {candidato}
                  </button>
                ))}
              </div>
            )}

            {vista === "dia" && (
              <div
                className={`flex items-center border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700/80 dark:bg-gray-800/60 ${
                  unDia ? "justify-end" : "justify-between"
                }`}
              >
                {/* Una fecha sola es obligatoria: no se ofrece dejarla vacía. */}
                {!unDia && (
                  <button
                    type="button"
                    onClick={limpiarRango}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    Borrar
                  </button>
                )}
                <button
                  type="button"
                  disabled={hoyDeshabilitado}
                  onClick={elegirHoy}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 enabled:hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
                >
                  Hoy
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Cierra el rango sin importar en qué orden se hayan pulsado los días. */
function cerrarRango(desdeYmdTexto: string, dia: Date): RangoFechas {
  const inicio = desdeYmd(desdeYmdTexto)!;
  return compararDia(dia, inicio) < 0
    ? rangoDesdeFechas(dia, inicio)
    : rangoDesdeFechas(inicio, dia);
}

function clasesDia(rol: RolDia): string {
  switch (rol) {
    case "inhabilitado":
      return "size-9 cursor-not-allowed rounded-full text-gray-300 dark:text-gray-600";
    case "inicio":
    case "fin":
    case "simple":
    // Rango a medio cerrar: el inicio ya está firme aunque aún no haya fin.
    case "parcial":
      return "size-9 rounded-full bg-brand-600 text-white shadow-sm hover:bg-brand-700";
    case "entre":
      return "h-9 w-full rounded-full bg-transparent text-brand-800 dark:text-brand-200";
    case "hoy":
      return "size-9 rounded-full ring-1 ring-brand-500 text-brand-700 dark:text-brand-300";
    default:
      return "size-9 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60";
  }
}

