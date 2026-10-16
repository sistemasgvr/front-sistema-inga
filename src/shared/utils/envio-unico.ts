/**
 * Guardia de envío único: mientras una tarea (p. ej. el guardado de un
 * formulario) está en curso, las siguientes llamadas se ignoran.
 *
 * La bandera es una variable mutable y no estado de React: dos clics en el
 * mismo tick, un doble clic o Enter repetido llegan antes de que React vuelva
 * a renderizar con el botón deshabilitado, y el estado todavía diría "libre".
 */
export type EnvioUnico = {
  /** Ejecuta la tarea si no hay otra en curso; si la hay, devuelve `undefined` sin llamarla. */
  ejecutar<T>(tarea: () => T | Promise<T>): Promise<T | undefined>;
  readonly enCurso: boolean;
};

export function crearEnvioUnico(onCambio?: (enCurso: boolean) => void): EnvioUnico {
  let enCurso = false;

  return {
    get enCurso() {
      return enCurso;
    },
    async ejecutar(tarea) {
      if (enCurso) return undefined;
      enCurso = true;
      onCambio?.(true);
      try {
        return await tarea();
      } finally {
        // Se libera con la respuesta del backend, sea éxito o error.
        enCurso = false;
        onCambio?.(false);
      }
    },
  };
}
