-- Función para calcular periodos transcurridos desde una fecha de inicio hasta hoy, basado en la periodicidad
CREATE OR REPLACE FUNCTION public.calcular_periodos_transcurridos(fecha_ini DATE, per TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE 
    WHEN per = 'DIARIA' THEN current_date - fecha_ini
    WHEN per = 'SEMANAL' THEN (current_date - fecha_ini) / 7
    WHEN per = 'CATORCENAL' THEN (current_date - fecha_ini) / 14
    WHEN per = 'QUINCENAL' THEN (current_date - fecha_ini) / 15
    WHEN per = 'MENSUAL' THEN (current_date - fecha_ini) / 30
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vista para el Análisis Dinámico de la Cartera (Mora y Faltas)
-- Security Invoker = on para que herede permisos (RLS) del usuario que consulta (el frontend)
DROP VIEW IF EXISTS vista_analisis_cartera CASCADE;
CREATE VIEW vista_analisis_cartera WITH (security_invoker = on) AS
SELECT 
  c.id as credito_id,
  c.zona_id,
  c.tipo,
  c.nombre_cliente,
  c.monto_otorgado,
  c.total_a_pagar,
  c.cuota_periodo,
  c.periodicidad,
  c.fecha_inicio,
  c.numero_periodos,
  c.estado,
  COALESCE(SUM(p.monto), 0) as total_pagado,
  c.total_a_pagar - COALESCE(SUM(p.monto), 0) as saldo_pendiente,
  
  -- Cálculo de Cuánto Debería Llevar Pagado (Expectativa)
  -- Límite superior: no puede superar los "numero_periodos" totales.
  LEAST(c.numero_periodos, public.calcular_periodos_transcurridos(c.fecha_inicio, c.periodicidad)) as periodos_transcurridos,
  
  -- Monto que matemáticamente debió haber abonado hasta hoy (Limitado al total_a_pagar)
  LEAST(
    c.total_a_pagar, 
    LEAST(c.numero_periodos, public.calcular_periodos_transcurridos(c.fecha_inicio, c.periodicidad)) * c.cuota_periodo
  ) as monto_esperado,
  
  -- Atraso (Si lo pagado es menor a lo esperado)
  GREATEST(
    0, 
    LEAST(
      c.total_a_pagar, 
      LEAST(c.numero_periodos, public.calcular_periodos_transcurridos(c.fecha_inicio, c.periodicidad)) * c.cuota_periodo
    ) - COALESCE(SUM(p.monto), 0)
  ) as monto_atrasado,
  
  -- Pagos Omitidos Totales (Atraso / Cuota)
  FLOOR(
    GREATEST(
      0, 
      LEAST(
        c.total_a_pagar, 
        LEAST(c.numero_periodos, public.calcular_periodos_transcurridos(c.fecha_inicio, c.periodicidad)) * c.cuota_periodo
      ) - COALESCE(SUM(p.monto), 0)
    ) / NULLIF(c.cuota_periodo, 0)
  ) as pagos_omitidos,

  -- Faltas (1 falta por cada 3 pagos omitidos)
  FLOOR(
    FLOOR(
      GREATEST(
        0, 
        LEAST(
          c.total_a_pagar, 
          LEAST(c.numero_periodos, public.calcular_periodos_transcurridos(c.fecha_inicio, c.periodicidad)) * c.cuota_periodo
        ) - COALESCE(SUM(p.monto), 0)
      ) / NULLIF(c.cuota_periodo, 0)
    ) / 3
  ) as faltas

FROM creditos c
LEFT JOIN pagos p ON c.id = p.credito_id AND p.tipo = 'ABONO'
WHERE c.estado = 'ACTIVO'
GROUP BY 
  c.id, c.zona_id, c.tipo, c.nombre_cliente, c.monto_otorgado, 
  c.total_a_pagar, c.cuota_periodo, c.periodicidad, c.fecha_inicio, 
  c.numero_periodos, c.estado;


-- Vista para Cobranza por Cobrador / Fechas
-- Útil para sumar pagos y ver quién cobró qué en un rango de fechas
DROP VIEW IF EXISTS vista_cobranza_cobrador CASCADE;
CREATE VIEW vista_cobranza_cobrador WITH (security_invoker = on) AS
SELECT 
  p.id as pago_id,
  p.credito_id,
  c.zona_id,
  z.nombre as nombre_zona,
  p.monto,
  p.tipo as tipo_pago,
  p.fecha_pago::DATE as fecha_pago,
  p.registrado_por as cobrador_id,
  perf.nombre_completo as cobrador_nombre,
  c.cuota_periodo
FROM pagos p
JOIN creditos c ON p.credito_id = c.id
JOIN zonas z ON c.zona_id = z.id
LEFT JOIN perfiles perf ON p.registrado_por = perf.id;
