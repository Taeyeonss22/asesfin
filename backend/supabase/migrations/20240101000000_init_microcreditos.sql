-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Parametros Sistema
CREATE TABLE parametros_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interes_porcentaje NUMERIC NOT NULL DEFAULT 20,
  cuota_por_mil NUMERIC NOT NULL DEFAULT 75,
  numero_periodos_default INTEGER NOT NULL DEFAULT 16
);

-- Insert default row
INSERT INTO parametros_sistema (interes_porcentaje, cuota_por_mil, numero_periodos_default) VALUES (20, 75, 16);

-- 2. Perfiles (vincular con auth.users en el futuro, pero lo dejaremos simple por ahora o vincularemos bien)
CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  rol TEXT DEFAULT 'COBRADOR'
);

-- Trigger for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_completo, rol)
  VALUES (new.id, new.raw_user_meta_data->>'nombre_completo', 'COBRADOR');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Creditos
CREATE TABLE creditos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT CHECK (tipo IN ('INDIVIDUAL', 'GRUPAL')) NOT NULL,
  monto_otorgado NUMERIC NOT NULL,
  total_a_pagar NUMERIC NOT NULL,
  cuota_periodo NUMERIC NOT NULL,
  periodicidad TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  numero_periodos INTEGER NOT NULL DEFAULT 16,
  estado TEXT CHECK (estado IN ('ACTIVO', 'PAGADO', 'MORA')) NOT NULL DEFAULT 'ACTIVO',
  creado_por UUID REFERENCES perfiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Integrantes Grupo
CREATE TABLE integrantes_grupo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credito_id UUID REFERENCES creditos(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  monto_otorgado NUMERIC NOT NULL,
  total_a_pagar NUMERIC NOT NULL,
  cuota_periodo NUMERIC NOT NULL,
  monto_garantia NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Pagos
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credito_id UUID REFERENCES creditos(id) ON DELETE CASCADE NOT NULL,
  integrante_id UUID REFERENCES integrantes_grupo(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL,
  tipo TEXT CHECK (tipo IN ('ABONO', 'AHORRO', 'MORA')) NOT NULL DEFAULT 'ABONO',
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registrado_por UUID REFERENCES perfiles(id)
);

-- 6. Vistas de Saldos
-- Saldo por Credito
CREATE VIEW vista_saldos_creditos AS
SELECT 
  c.id as credito_id,
  c.total_a_pagar,
  COALESCE(SUM(p.monto), 0) as total_pagado,
  c.total_a_pagar - COALESCE(SUM(p.monto), 0) as saldo_pendiente
FROM creditos c
LEFT JOIN pagos p ON c.id = p.credito_id AND p.tipo = 'ABONO'
GROUP BY c.id, c.total_a_pagar;

-- Saldo por Integrante
CREATE VIEW vista_saldos_integrantes AS
SELECT 
  i.id as integrante_id,
  i.credito_id,
  i.total_a_pagar,
  COALESCE(SUM(p.monto), 0) as total_pagado,
  i.total_a_pagar - COALESCE(SUM(p.monto), 0) as saldo_pendiente
FROM integrantes_grupo i
LEFT JOIN pagos p ON i.id = p.integrante_id AND p.tipo = 'ABONO'
GROUP BY i.id, i.credito_id, i.total_a_pagar;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE creditos;
ALTER PUBLICATION supabase_realtime ADD TABLE pagos;

-- Setup RLS
ALTER TABLE parametros_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrantes_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Temporary Allow All Policies for Phase 1 to ensure smooth testing
CREATE POLICY "Allow All" ON parametros_sistema FOR ALL USING (true);
CREATE POLICY "Allow All" ON perfiles FOR ALL USING (true);
CREATE POLICY "Allow All" ON creditos FOR ALL USING (true);
CREATE POLICY "Allow All" ON integrantes_grupo FOR ALL USING (true);
CREATE POLICY "Allow All" ON pagos FOR ALL USING (true);
