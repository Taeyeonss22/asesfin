-- 1. Create pagos_metadata table
CREATE TABLE pagos_metadata (
  pago_id UUID PRIMARY KEY REFERENCES pagos(id) ON DELETE CASCADE,
  latitud NUMERIC,
  longitud NUMERIC,
  evidencia_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migrate existing data
INSERT INTO pagos_metadata (pago_id, latitud, longitud, evidencia_url)
SELECT id, latitud, longitud, evidencia_url 
FROM pagos
WHERE latitud IS NOT NULL OR longitud IS NOT NULL OR evidencia_url IS NOT NULL;

-- 3. Drop columns from pagos
ALTER TABLE pagos DROP COLUMN IF EXISTS latitud CASCADE;
ALTER TABLE pagos DROP COLUMN IF EXISTS longitud CASCADE;
ALTER TABLE pagos DROP COLUMN IF EXISTS evidencia_url CASCADE;

-- 4. Enable RLS on pagos_metadata
ALTER TABLE pagos_metadata ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert (so cobradores can upload their metadata)
CREATE POLICY "Allow Insert to authenticated" 
ON pagos_metadata FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow ONLY admin and oficina to select
CREATE POLICY "Allow Select to admin and oficina" 
ON pagos_metadata FOR SELECT 
TO authenticated 
USING (
  (auth.jwt() ->> 'role') IN ('admin', 'oficina')
);

-- 5. Recreate vista_feed_pagos safely using LEFT JOIN
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
  pm.latitud,
  pm.longitud,
  pm.evidencia_url,
  perf.nombre_completo as cobrador_nombre,
  COALESCE(i.nombre_completo, COALESCE(c.nombre_cliente, 'Crédito Individual ' || substring(c.id::text from 1 for 8))) as cliente_nombre
FROM pagos p
JOIN creditos c ON p.credito_id = c.id
LEFT JOIN integrantes_grupo i ON p.integrante_id = i.id
LEFT JOIN perfiles perf ON p.registrado_por = perf.id
LEFT JOIN pagos_metadata pm ON p.id = pm.pago_id
ORDER BY p.fecha_pago DESC;
