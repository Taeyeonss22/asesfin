-- Reparar políticas de parametros_sistema (se borró el "Allow All" en Fase 2A pero no se reemplazó)
CREATE POLICY "Parametros Select" ON parametros_sistema FOR SELECT USING (true);
CREATE POLICY "Parametros Mod" ON parametros_sistema FOR ALL USING (public.is_admin());
