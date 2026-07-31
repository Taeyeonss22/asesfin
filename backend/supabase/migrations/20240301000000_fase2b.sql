-- 1. Modificar tabla creditos para añadir nombre_cliente
ALTER TABLE creditos ADD COLUMN IF NOT EXISTS nombre_cliente TEXT;

-- 2. Tablas de Configuración y Plantillas
CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_empresa TEXT NOT NULL DEFAULT 'Mi Empresa Financiera',
  logo_url TEXT,
  direccion TEXT DEFAULT 'Dirección de la empresa',
  telefono TEXT DEFAULT '123-456-7890',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar única fila de configuración
INSERT INTO configuracion_empresa (nombre_empresa) VALUES ('Mi Empresa Financiera');

CREATE TABLE IF NOT EXISTS plantillas_contratos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT CHECK (tipo IN ('INDIVIDUAL', 'GRUPAL')) NOT NULL UNIQUE,
  contenido TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar plantillas por defecto (formato HTML básico)
INSERT INTO plantillas_contratos (tipo, contenido) VALUES 
('INDIVIDUAL', '
<div style="font-family: sans-serif; line-height: 1.6;">
  <h2 style="text-align: center;">CONTRATO DE CRÉDITO INDIVIDUAL</h2>
  <p style="text-align: right;"><strong>Folio:</strong> {{credito_id}}</p>
  <p>Conste por el presente documento el contrato de crédito individual que celebran por una parte <strong>{{empresa_nombre}}</strong>, y por la otra el/la C. <strong>{{cliente_nombre}}</strong>, quien declara tener su domicilio en la localidad de __________________.</p>
  <p><strong>CLÁUSULAS:</strong></p>
  <ol>
    <li>El acreditante otorga al acreditado la cantidad de <strong>${{monto_otorgado}}</strong>.</li>
    <li>El acreditado se obliga a pagar la cantidad total de <strong>${{total_a_pagar}}</strong>.</li>
    <li>Los pagos se realizarán de forma <strong>{{periodicidad}}</strong>, en {{numero_periodos}} cuotas de <strong>${{cuota_periodo}}</strong> cada una.</li>
    <li>La fecha de inicio del crédito es <strong>{{fecha_inicio}}</strong>.</li>
  </ol>
  <br/><br/><br/>
  <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 50px;">
    <div>
      <hr style="width: 200px; border-color: black;"/>
      <p>{{empresa_nombre}}</p>
    </div>
    <div>
      <hr style="width: 200px; border-color: black;"/>
      <p>{{cliente_nombre}}<br/><small>El Acreditado</small></p>
    </div>
  </div>
</div>
'),
('GRUPAL', '
<div style="font-family: sans-serif; line-height: 1.6;">
  <h2 style="text-align: center;">CONTRATO DE CRÉDITO SOLIDARIO (GRUPAL)</h2>
  <p style="text-align: right;"><strong>Folio:</strong> {{credito_id}}</p>
  <p>Conste por el presente documento el contrato de crédito grupal que celebran por una parte <strong>{{empresa_nombre}}</strong>, y por la otra el grupo solidario compuesto por los siguientes integrantes:</p>
  
  {{tabla_integrantes}}

  <p><strong>CLÁUSULAS:</strong></p>
  <ol>
    <li>El acreditante otorga al grupo la cantidad total de <strong>${{monto_otorgado_total}}</strong>.</li>
    <li>El grupo se obliga solidariamente a pagar la cantidad de <strong>${{total_a_pagar_total}}</strong>.</li>
    <li>Los pagos se realizarán de forma <strong>{{periodicidad}}</strong>, en {{numero_periodos}} cuotas.</li>
    <li>La fecha de inicio del crédito es <strong>{{fecha_inicio}}</strong>.</li>
  </ol>
  <br/><br/><br/>
  <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 50px;">
    <div>
      <hr style="width: 200px; border-color: black;"/>
      <p>{{empresa_nombre}}</p>
    </div>
    <div>
      <hr style="width: 200px; border-color: black;"/>
      <p>Representante del Grupo</p>
    </div>
  </div>
</div>
');

-- 3. Configurar RLS para las nuevas tablas
ALTER TABLE configuracion_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config Select" ON configuracion_empresa FOR SELECT USING (true);
CREATE POLICY "Config Mod" ON configuracion_empresa FOR ALL USING (public.is_admin());

CREATE POLICY "Plantillas Select" ON plantillas_contratos FOR SELECT USING (true);
CREATE POLICY "Plantillas Mod" ON plantillas_contratos FOR ALL USING (public.is_admin());


-- 4. Recrear Vistas SQL para incluir nombre_cliente
DROP VIEW IF EXISTS vista_saldos_creditos CASCADE;
CREATE VIEW vista_saldos_creditos WITH (security_invoker = on) AS
SELECT 
  c.id as credito_id,
  c.zona_id,
  c.tipo,
  c.nombre_cliente,
  c.monto_otorgado,
  c.periodicidad,
  c.estado,
  c.fecha_inicio,
  c.numero_periodos,
  c.total_a_pagar,
  COALESCE(SUM(p.monto), 0) as total_pagado,
  c.total_a_pagar - COALESCE(SUM(p.monto), 0) as saldo_pendiente
FROM creditos c
LEFT JOIN pagos p ON c.id = p.credito_id AND p.tipo = 'ABONO'
GROUP BY 
  c.id, c.zona_id, c.tipo, c.nombre_cliente, c.monto_otorgado, c.periodicidad, 
  c.estado, c.fecha_inicio, c.numero_periodos, c.total_a_pagar;

DROP VIEW IF EXISTS vista_feed_pagos CASCADE;
CREATE VIEW vista_feed_pagos WITH (security_invoker = on) AS
SELECT 
  p.id as pago_id,
  p.credito_id,
  c.zona_id,
  p.monto,
  p.tipo as tipo_pago,
  p.fecha_pago,
  p.registrado_por,
  perf.nombre_completo as cobrador_nombre,
  -- Si hay integrante, muestra el integrante. Si no, usa el nombre_cliente de la tabla creditos.
  COALESCE(i.nombre_completo, COALESCE(c.nombre_cliente, 'Crédito Individual ' || substring(c.id::text from 1 for 8))) as cliente_nombre
FROM pagos p
JOIN creditos c ON p.credito_id = c.id
LEFT JOIN integrantes_grupo i ON p.integrante_id = i.id
LEFT JOIN perfiles perf ON p.registrado_por = perf.id
ORDER BY p.fecha_pago DESC;

-- Recrear métricas por las dudas (ya que dependían indirectamente)
DROP VIEW IF EXISTS vista_metricas_dashboard;
CREATE VIEW vista_metricas_dashboard WITH (security_invoker = on) AS
SELECT
  c.zona_id,
  COUNT(c.id) as creditos_activos,
  SUM(c.total_a_pagar - COALESCE(p_agg.total_pagado, 0)) as adeudo_total_cartera
FROM creditos c
LEFT JOIN (
  SELECT credito_id, SUM(monto) as total_pagado 
  FROM pagos WHERE tipo = 'ABONO' GROUP BY credito_id
) p_agg ON c.id = p_agg.credito_id
WHERE c.estado = 'ACTIVO'
GROUP BY c.zona_id;
