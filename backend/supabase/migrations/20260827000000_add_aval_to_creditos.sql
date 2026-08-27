-- Añadir columnas para Aval en creditos
ALTER TABLE creditos ADD COLUMN IF NOT EXISTS aval_nombre TEXT;
ALTER TABLE creditos ADD COLUMN IF NOT EXISTS aval_telefono TEXT;
ALTER TABLE creditos ADD COLUMN IF NOT EXISTS aval_domicilio TEXT;
