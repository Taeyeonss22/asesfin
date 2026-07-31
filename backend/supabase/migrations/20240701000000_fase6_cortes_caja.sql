-- Migración: Fase 6 - Módulo de Corte de Caja Diario
-- Crea la tabla para almacenar los cortes de los cobradores
-- y agrega la referencia en la tabla de pagos.

CREATE TABLE cortes_diarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cobrador_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_abonos NUMERIC NOT NULL DEFAULT 0,
  total_ahorros NUMERIC NOT NULL DEFAULT 0,
  total_mora NUMERIC NOT NULL DEFAULT 0,
  gran_total NUMERIC NOT NULL DEFAULT 0,
  estado TEXT CHECK (estado IN ('PENDIENTE', 'CONFIRMADO')) NOT NULL DEFAULT 'PENDIENTE',
  notas TEXT,
  confirmado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar la columna a la tabla de pagos
ALTER TABLE pagos ADD COLUMN corte_id UUID REFERENCES cortes_diarios(id) ON DELETE SET NULL;

-- Habilitar Realtime para los cortes
ALTER PUBLICATION supabase_realtime ADD TABLE cortes_diarios;

-- Habilitar RLS
ALTER TABLE cortes_diarios ENABLE ROW LEVEL SECURITY;

-- Política temporal "Allow All" (Igual que en las tablas base iniciales)
-- Esto permite lectura/escritura libre, confiando en la lógica de la UI y el esquema actual.
CREATE POLICY "Allow All" ON cortes_diarios FOR ALL USING (true);
