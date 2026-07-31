-- 1. Nuevas Tablas: Zonas y Relación con Cobradores
CREATE TABLE IF NOT EXISTS zonas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cobradores_zonas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cobrador_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  zona_id UUID REFERENCES zonas(id) ON DELETE CASCADE,
  UNIQUE(cobrador_id, zona_id)
);

-- 2. Modificar Creditos para asignarles zona
ALTER TABLE creditos ADD COLUMN IF NOT EXISTS zona_id UUID REFERENCES zonas(id);

-- Insertar una zona por defecto si no existen, y asignarla a los creditos existentes para no romper
INSERT INTO zonas (nombre) VALUES ('Zona General (Legacy)') ON CONFLICT DO NOTHING;
DO $$
DECLARE
  default_zona UUID;
BEGIN
  SELECT id INTO default_zona FROM zonas WHERE nombre = 'Zona General (Legacy)' LIMIT 1;
  UPDATE creditos SET zona_id = default_zona WHERE zona_id IS NULL;
END $$;
ALTER TABLE creditos ALTER COLUMN zona_id SET NOT NULL;

-- 3. Funciones Helper para RLS
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS TEXT AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_office()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_rol() IN ('ADMIN', 'OFICINA');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_rol() = 'ADMIN';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_zone_access(check_zona_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM cobradores_zonas 
    WHERE cobrador_id = auth.uid() AND zona_id = check_zona_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_credito_access(check_credito_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM creditos 
    WHERE id = check_credito_id 
    AND (public.is_admin_or_office() OR public.has_zone_access(zona_id))
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Reemplazar Políticas Anteriores de "Allow All"
DROP POLICY IF EXISTS "Allow All" ON parametros_sistema;
DROP POLICY IF EXISTS "Allow All" ON perfiles;
DROP POLICY IF EXISTS "Allow All" ON creditos;
DROP POLICY IF EXISTS "Allow All" ON integrantes_grupo;
DROP POLICY IF EXISTS "Allow All" ON pagos;

-- Habilitar RLS en nuevas tablas
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobradores_zonas ENABLE ROW LEVEL SECURITY;

-- Políticas para Zonas (Todos pueden ver, solo ADMIN puede modificar)
CREATE POLICY "Zonas Select" ON zonas FOR SELECT USING (true);
CREATE POLICY "Zonas Mod" ON zonas FOR ALL USING (public.is_admin());

-- Políticas para Cobradores-Zonas (Todos pueden ver, solo ADMIN puede modificar)
CREATE POLICY "CobradoresZonas Select" ON cobradores_zonas FOR SELECT USING (true);
CREATE POLICY "CobradoresZonas Mod" ON cobradores_zonas FOR ALL USING (public.is_admin());

-- Políticas para Perfiles
CREATE POLICY "Perfiles Select" ON perfiles FOR SELECT USING (true); -- Permite ver perfiles para selects en el frontend
CREATE POLICY "Perfiles Mod" ON perfiles FOR ALL USING (public.is_admin());
CREATE POLICY "Perfiles Self Mod" ON perfiles FOR UPDATE USING (id = auth.uid());

-- Políticas para Creditos
CREATE POLICY "Creditos Select" ON creditos FOR SELECT USING (public.is_admin_or_office() OR public.has_zone_access(zona_id));
CREATE POLICY "Creditos Insert" ON creditos FOR INSERT WITH CHECK (public.is_admin_or_office() OR public.has_zone_access(zona_id));
CREATE POLICY "Creditos Update" ON creditos FOR UPDATE USING (public.is_admin_or_office() OR public.has_zone_access(zona_id));

-- Políticas para Integrantes
CREATE POLICY "Integrantes Select" ON integrantes_grupo FOR SELECT USING (public.has_credito_access(credito_id));
CREATE POLICY "Integrantes Insert" ON integrantes_grupo FOR INSERT WITH CHECK (public.has_credito_access(credito_id));
CREATE POLICY "Integrantes Update" ON integrantes_grupo FOR UPDATE USING (public.has_credito_access(credito_id));

-- Políticas para Pagos
CREATE POLICY "Pagos Select" ON pagos FOR SELECT USING (public.has_credito_access(credito_id));
CREATE POLICY "Pagos Insert" ON pagos FOR INSERT WITH CHECK (public.has_credito_access(credito_id));
CREATE POLICY "Pagos Update" ON pagos FOR UPDATE USING (public.has_credito_access(credito_id));

-- 5. Vistas SQL Seguras (SECURITY INVOKER)
-- Actualizamos la vista existente para que respete el RLS (security_invoker = on)
DROP VIEW IF EXISTS vista_saldos_creditos;
CREATE VIEW vista_saldos_creditos WITH (security_invoker = on) AS
SELECT 
  c.id as credito_id,
  c.zona_id,
  c.tipo,
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
  c.id, c.zona_id, c.tipo, c.monto_otorgado, c.periodicidad, 
  c.estado, c.fecha_inicio, c.numero_periodos, c.total_a_pagar;

DROP VIEW IF EXISTS vista_saldos_integrantes;
CREATE VIEW vista_saldos_integrantes WITH (security_invoker = on) AS
SELECT 
  i.id as integrante_id,
  i.credito_id,
  i.nombre_completo,
  i.total_a_pagar,
  COALESCE(SUM(p.monto), 0) as total_pagado,
  i.total_a_pagar - COALESCE(SUM(p.monto), 0) as saldo_pendiente
FROM integrantes_grupo i
LEFT JOIN pagos p ON i.id = p.integrante_id AND p.tipo = 'ABONO'
GROUP BY i.id, i.credito_id, i.nombre_completo, i.total_a_pagar;

-- Nueva vista para el Feed en Vivo (Dashboard)
DROP VIEW IF EXISTS vista_feed_pagos;
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
  -- Nombre real del cliente (si es grupo, toma el del integrante, si es individual, podríamos requerir un campo nombre en credito,
  -- PERO como en la Fase 1 el individual no tiene "nombre" (no lo agregamos a creditos), usaremos el ID corto por ahora, 
  -- o si hubiese un nombre, lo mostraríamos. Para esta fase, mostraremos "Crédito Individual [ID]" o el nombre del integrante)
  COALESCE(i.nombre_completo, 'Crédito Individual ' || substring(c.id::text from 1 for 8)) as cliente_nombre
FROM pagos p
JOIN creditos c ON p.credito_id = c.id
LEFT JOIN integrantes_grupo i ON p.integrante_id = i.id
LEFT JOIN perfiles perf ON p.registrado_por = perf.id
ORDER BY p.fecha_pago DESC;

-- Vista para métricas (Simplificada para la Fase 2A)
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

-- Asegurarse de que perfiles pueda ser actualizado para asignar rol y estatus (si lo agregáramos luego).
