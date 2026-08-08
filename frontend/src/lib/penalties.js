import { addDays, addWeeks, addMonths, differenceInDays } from 'date-fns';

/**
 * Calcula la fecha programada de un pago
 */
export const calcularFechaProgramada = (fechaInicio, numeroPago, periodicidad) => {
  const f = new Date(fechaInicio);
  // Ajuste de zona horaria local
  f.setMinutes(f.getMinutes() + f.getTimezoneOffset());
  
  if (periodicidad === 'SEMANAL') return addWeeks(f, numeroPago);
  if (periodicidad === 'QUINCENAL' || periodicidad === 'CATORCENAL') return addDays(f, numeroPago * (periodicidad === 'QUINCENAL' ? 15 : 14));
  if (periodicidad === 'MENSUAL') return addMonths(f, numeroPago);
  if (periodicidad === 'DIARIA') return addDays(f, numeroPago);
  
  return addWeeks(f, numeroPago);
};

/**
 * Calcula los intereses moratorios y faltas de pago dinámicamente
 * @param {Object} credit - Objeto del crédito con monto, inicio, periodos
 * @param {Array} pagos - Historial de pagos (ABONO y MORA)
 * @param {Number} saldo_pendiente_base - Saldo que arroja la BD (Monto Otorgado + Interes - Suma Abonos)
 */
export const enrichCreditData = (credit, pagos = [], saldo_pendiente_base = 0) => {
  if (!credit) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Agrupar pagos por periodo
  const pagosAgrupados = {};
  let totalMoraPagada = 0;

  pagos.forEach(p => {
    if (p.tipo === 'MORA') {
      totalMoraPagada += parseFloat(p.monto) || 0;
      return;
    }
    // Solo ABONO para la cobertura del periodo
    if (p.tipo === 'ABONO') {
      if (!p.numero_pago) return;
      if (!pagosAgrupados[p.numero_pago]) pagosAgrupados[p.numero_pago] = 0;
      pagosAgrupados[p.numero_pago] += parseFloat(p.monto) || 0;
    }
  });

  const numPeriodos = credit.numero_periodos || 16;
  let incompletos = 0;
  let faltasDirectas = 0;
  let ultimaFecha = new Date(credit.fecha_inicio);

  for (let i = 1; i <= numPeriodos; i++) {
    const fechaProg = calcularFechaProgramada(credit.fecha_inicio, i, credit.periodicidad);
    ultimaFecha = fechaProg;
    const pagado = pagosAgrupados[i] || 0;
    
    // Solo se evalúa si la fecha programada ya pasó
    if (fechaProg < hoy) {
      if (pagado === 0) {
        // Pago nulo genera 1 falta directa
        faltasDirectas++;
      } else if (pagado < (credit.cuota_periodo - 1)) {
        // Pago parcial genera 1 incompleto
        incompletos++;
      }
    }
  }

  // Regla 1: Faltas de Pago
  // Faltas totales = faltas por $0 + 1 falta por cada 3 incompletos
  const numero_faltas = faltasDirectas + Math.floor(incompletos / 3);
  const costo_por_falta = (credit.monto_otorgado / 1000) * 4 * 7;
  const costo_faltas_total = costo_por_falta * numero_faltas;

  // Regla 2: Moratorio por Vencimiento
  let moratorio_vencimiento = 0;
  const diasParaVencer = differenceInDays(ultimaFecha, hoy);
  const estaVencido = diasParaVencer < 0 && saldo_pendiente_base > 0;
  
  if (estaVencido) {
    // Semanas de atraso desde el vencimiento final
    const semanasVencidas = Math.floor(Math.abs(diasParaVencer) / 7);
    if (semanasVencidas > 0) {
      // 2.5% compuesto semanal
      const deudaConInteresCompuesto = saldo_pendiente_base * Math.pow(1.025, semanasVencidas);
      moratorio_vencimiento = deudaConInteresCompuesto - saldo_pendiente_base;
    }
  }

  const enRiesgoDeVencimiento = diasParaVencer >= 0 && diasParaVencer <= 7 && saldo_pendiente_base > 0;

  // Adeudo Total Real
  // Los pagos de MORA restan a los costos extra.
  const totalPenalizaciones = costo_faltas_total + moratorio_vencimiento;
  const penalizacionesPendientes = Math.max(0, totalPenalizaciones - totalMoraPagada);
  
  const adeudo_total_real = saldo_pendiente_base + penalizacionesPendientes;

  return {
    ...credit,
    fecha_vencimiento: ultimaFecha.toISOString().split('T')[0],
    incompletos,
    faltas_computadas: numero_faltas,
    costo_faltas: costo_faltas_total,
    moratorio: moratorio_vencimiento,
    total_mora_pagada: totalMoraPagada,
    penalizaciones_pendientes: penalizacionesPendientes,
    saldo_base: saldo_pendiente_base,
    adeudo_total_real: adeudo_total_real > 0 ? adeudo_total_real : 0,
    dias_para_vencer: diasParaVencer,
    esta_vencido: estaVencido,
    en_riesgo_vencimiento: enRiesgoDeVencimiento
  };
};
