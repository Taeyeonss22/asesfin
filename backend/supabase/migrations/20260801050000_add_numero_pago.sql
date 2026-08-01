-- Añadir columna numero_pago a la tabla pagos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS numero_pago INTEGER;

-- Comentario para la columna
COMMENT ON COLUMN pagos.numero_pago IS 'Identifica a qué periodo o semana del ciclo corresponde el pago (ej. 1, 2, 3...)';

-- Notificar a PostgREST para recargar el esquema de caché
NOTIFY pgrst, 'reload schema';
