-- 1. Añadir columnas a pagos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS latitud NUMERIC;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS longitud NUMERIC;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS evidencia_url TEXT;

-- 2. Crear bucket de Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidencias_pagos', 'evidencias_pagos', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar RLS para el Bucket (storage.objects)
-- Permitir a cualquier usuario autenticado subir fotos al bucket
CREATE POLICY "Permitir subida de evidencias" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'evidencias_pagos' );

-- Permitir a cualquiera ver las fotos
CREATE POLICY "Permitir lectura de evidencias" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'evidencias_pagos' );


-- 3. Actualizar vista de feed para incluir latitud, longitud y foto
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
  p.latitud,
  p.longitud,
  p.evidencia_url,
  perf.nombre_completo as cobrador_nombre,
  COALESCE(i.nombre_completo, COALESCE(c.nombre_cliente, 'Crédito Individual ' || substring(c.id::text from 1 for 8))) as cliente_nombre
FROM pagos p
JOIN creditos c ON p.credito_id = c.id
LEFT JOIN integrantes_grupo i ON p.integrante_id = i.id
LEFT JOIN perfiles perf ON p.registrado_por = perf.id
ORDER BY p.fecha_pago DESC;
