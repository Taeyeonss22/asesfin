-- 1. Create tables
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo TEXT NOT NULL UNIQUE,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE grupo_integrantes (
  grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (grupo_id, cliente_id)
);

-- 2. Alter existing tables
ALTER TABLE creditos ADD COLUMN cliente_id UUID REFERENCES clientes(id);
ALTER TABLE creditos ADD COLUMN grupo_id UUID REFERENCES grupos(id);
ALTER TABLE integrantes_grupo ADD COLUMN cliente_id UUID REFERENCES clientes(id);

-- 3. Data Migration for Clientes
-- From creditos (individuales)
INSERT INTO clientes (nombre_completo)
SELECT DISTINCT nombre_cliente 
FROM creditos 
WHERE tipo = 'INDIVIDUAL' AND nombre_cliente IS NOT NULL
ON CONFLICT (nombre_completo) DO NOTHING;

-- From integrantes_grupo (grupales)
INSERT INTO clientes (nombre_completo)
SELECT DISTINCT nombre_completo 
FROM integrantes_grupo 
WHERE nombre_completo IS NOT NULL
ON CONFLICT (nombre_completo) DO NOTHING;

-- 4. Map references back
UPDATE creditos c
SET cliente_id = cl.id
FROM clientes cl
WHERE c.nombre_cliente = cl.nombre_completo AND c.tipo = 'INDIVIDUAL';

UPDATE integrantes_grupo ig
SET cliente_id = cl.id
FROM clientes cl
WHERE ig.nombre_completo = cl.nombre_completo;

-- 5. Data Migration for Grupos
INSERT INTO grupos (id, nombre)
SELECT id, COALESCE(nombre_cliente, 'Grupo Solidario ' || substr(id::text, 1, 8))
FROM creditos
WHERE tipo = 'GRUPAL';

-- Map references back
UPDATE creditos
SET grupo_id = id
WHERE tipo = 'GRUPAL';

-- Populate grupo_integrantes
INSERT INTO grupo_integrantes (grupo_id, cliente_id)
SELECT c.grupo_id, ig.cliente_id
FROM creditos c
JOIN integrantes_grupo ig ON c.id = ig.credito_id
WHERE c.tipo = 'GRUPAL' AND ig.cliente_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Recreate View
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
  c.total_a_pagar,
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
  c.total_a_pagar;

-- 7. Add RLS Policies
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_integrantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All" ON clientes FOR ALL USING (true);
CREATE POLICY "Allow All" ON grupos FOR ALL USING (true);
CREATE POLICY "Allow All" ON grupo_integrantes FOR ALL USING (true);
