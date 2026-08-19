ALTER TABLE creditos ADD COLUMN garantia_liquida NUMERIC DEFAULT 0;
ALTER TABLE creditos ADD COLUMN estado_garantia TEXT CHECK (estado_garantia IN ('RETENIDA', 'APLICADA', 'DEVUELTA')) DEFAULT 'RETENIDA';

-- Recrear la vista de saldos para incluir garantia
DROP VIEW IF EXISTS vista_saldos_creditos CASCADE;
CREATE VIEW vista_saldos_creditos WITH (security_invoker = on) AS
SELECT 
  c.id as credito_id,
  c.zona_id,
  c.tipo,
  c.cliente_id,
  c.grupo_id,
  COALESCE(cl.nombre_completo, g.nombre, c.nombre_cliente) as nombre_cliente,
  c.monto_otorgado,
  c.periodicidad,
  c.estado,
  c.fecha_inicio,
  c.numero_periodos,
  c.cuota_periodo,
  c.total_a_pagar,
  c.garantia_liquida,
  c.estado_garantia,
  COALESCE(SUM(p.monto), 0) as total_pagado,
  c.total_a_pagar - COALESCE(SUM(p.monto), 0) as saldo_pendiente
FROM creditos c
LEFT JOIN clientes cl ON c.cliente_id = cl.id
LEFT JOIN grupos g ON c.grupo_id = g.id
LEFT JOIN pagos p ON c.id = p.credito_id AND p.tipo = 'ABONO'
GROUP BY 
  c.id, 
  c.zona_id,
  c.tipo, 
  c.cliente_id,
  c.grupo_id,
  cl.nombre_completo,
  g.nombre,
  c.nombre_cliente,
  c.monto_otorgado,
  c.periodicidad,
  c.estado,
  c.fecha_inicio,
  c.numero_periodos,
  c.cuota_periodo,
  c.total_a_pagar,
  c.garantia_liquida,
  c.estado_garantia;
