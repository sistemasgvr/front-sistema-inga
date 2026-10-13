// Turno de un día anterior con el que el cajero ya eligió seguir. Va en
// sessionStorage para no volver a preguntar en cada navegación de la sesión,
// y se comparte entre "Mi turno" y los cobros para que la elección valga en ambos.
const CLAVE_CONTINUAR = "caja:turno-anterior-continuado";

export function leerTurnoContinuado(): number | null {
  try {
    const guardado =
      typeof window === "undefined" ? null : sessionStorage.getItem(CLAVE_CONTINUAR);
    return guardado ? Number(guardado) : null;
  } catch {
    // Sin storage: se vuelve a preguntar, que es lo seguro.
    return null;
  }
}

export function guardarTurnoContinuado(idTurno: number) {
  try {
    sessionStorage.setItem(CLAVE_CONTINUAR, String(idTurno));
  } catch {
    // Queda en memoria del componente hasta recargar la página.
  }
}
