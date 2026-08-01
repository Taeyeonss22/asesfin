-- Añadir columna eslogan a configuracion_empresa
ALTER TABLE configuracion_empresa
  ADD COLUMN IF NOT EXISTS eslogan TEXT;

-- Configurar un bucket público en Storage para los logos de la empresa
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 5242880, '{image/png, image/jpeg, image/jpg, image/webp}')
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  allowed_mime_types = '{image/png, image/jpeg, image/jpg, image/webp}',
  file_size_limit = 5242880;

-- Políticas RLS para el bucket "logos" en storage.objects
-- Todos pueden ver los logos
CREATE POLICY "Logos publicos para todos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Solo administradores pueden subir/modificar logos
CREATE POLICY "Admins pueden gestionar logos"
ON storage.objects FOR ALL
USING (bucket_id = 'logos' AND public.is_admin())
WITH CHECK (bucket_id = 'logos' AND public.is_admin());
