-- Allow deletes on pagos for Superadmins
CREATE POLICY "Pagos Delete" ON pagos FOR DELETE 
USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'SUPERADMIN'
);
