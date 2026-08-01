-- 1. Restaurar las columnas a la tabla pagos para que la app móvil en producción no falle al insertar
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS latitud NUMERIC;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS longitud NUMERIC;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS evidencia_url TEXT;

-- 2. Hacer que la llave foránea de pagos_metadata sea deferrable (para poder insertar antes de que se inserte en pagos)
ALTER TABLE pagos_metadata DROP CONSTRAINT pagos_metadata_pago_id_fkey;
ALTER TABLE pagos_metadata ADD CONSTRAINT pagos_metadata_pago_id_fkey 
  FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- 3. Crear función del trigger que mueve los metadatos a pagos_metadata y los anula en pagos
CREATE OR REPLACE FUNCTION procesar_metadatos_pago()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el pago trae datos sensibles, los movemos a la tabla segura
  IF NEW.latitud IS NOT NULL OR NEW.longitud IS NOT NULL OR NEW.evidencia_url IS NOT NULL THEN
    INSERT INTO pagos_metadata (pago_id, latitud, longitud, evidencia_url)
    VALUES (NEW.id, NEW.latitud, NEW.longitud, NEW.evidencia_url)
    ON CONFLICT (pago_id) DO UPDATE SET
      latitud = EXCLUDED.latitud,
      longitud = EXCLUDED.longitud,
      evidencia_url = EXCLUDED.evidencia_url;
      
    -- Borramos la evidencia de la tabla pública de pagos para que el cobrador jamás pueda verla
    NEW.latitud := NULL;
    NEW.longitud := NULL;
    NEW.evidencia_url := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear el trigger en la tabla pagos
DROP TRIGGER IF EXISTS trg_procesar_metadatos_pago ON pagos;
CREATE TRIGGER trg_procesar_metadatos_pago
BEFORE INSERT OR UPDATE ON pagos
FOR EACH ROW EXECUTE FUNCTION procesar_metadatos_pago();

-- 5. Recargar la caché de PostgREST para que la API sepa que las columnas volvieron
NOTIFY pgrst, 'reload schema';
