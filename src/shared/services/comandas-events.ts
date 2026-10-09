export const COMANDA_CONFIRMADA = "inga:comanda-confirmada";

export function notificarComandaConfirmada() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COMANDA_CONFIRMADA));
  try {
    const canal = new BroadcastChannel(COMANDA_CONFIRMADA);
    canal.postMessage("actualizar");
    canal.close();
  } catch { /* La consulta periódica cubre navegadores sin BroadcastChannel. */ }
}
