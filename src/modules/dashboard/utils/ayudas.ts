/**
 * Textos de ayuda de las tarjetas y gráficos del dashboard: qué suma cada cifra
 * y cómo se calcula. `periodo` es el rango elegido ya formateado
 * ("01/10/2026 — 16/10/2026").
 */
export function ayudasDashboard(periodo: string) {
  const enRango = `Suma de todo lo registrado del ${periodo.replace(" — ", " al ")}`;
  return {
    ventas:
      "Total cobrado con IGV de los pedidos cobrados en el período (todas las formas de pago, incluido el crédito al consorcio). " +
      "La venta sin IGV que aparece debajo es la misma venta sin el impuesto: no se suman.",
    ticket:
      "Ventas con IGV ÷ número de pedidos cobrados. Es lo que gasta en promedio cada cuenta: sirve para ver si las " +
      "sugerencias del mozo, las promociones o un cambio de precios hacen que cada mesa consuma más.",
    margen:
      "Ventas sin IGV − costo de receta de lo vendido (unidades vendidas, incluidas cortesías, × costo actual de la receta). " +
      "Indica cuánto deja la carta antes de pagar gastos y planilla.",
    utilidad:
      "Ventas sin IGV − (compras del día + gastos administrativos + planilla) pagados en el período. " +
      "Es lo que realmente quedó. No resta además el costo de receta, porque los insumos ya están en las compras del día.",
    pedidos: "Pedidos cobrados en el período, de mesa, para llevar y delivery. Los anulados no cuentan.",
    comensales:
      "Personas registradas en los pedidos cobrados. Consumo por comensal = ventas con IGV ÷ comensales.",
    compras: `${enRango}: compras del día pagadas en efectivo, Yape o a crédito de proveedor.`,
    administrativos: `${enRango}: gastos administrativos (alquiler, servicios, mantenimiento, etc.) según su fecha de gasto.`,
    planilla: `${enRango}: pagos de planilla según su fecha de pago. Es lo pagado, no lo que se debe.`,
    totalGastos: `${enRango}: compras del día + gastos administrativos + planilla.`,
    ingresosGastos:
      "Ingresos: ventas cobradas sin IGV, con todas las formas de pago (efectivo, Yape, tarjeta y crédito al consorcio). " +
      "Gastos: compras del día + gastos administrativos + pagos de planilla, según su fecha. Utilidad = ingresos − gastos.",
  };
}
