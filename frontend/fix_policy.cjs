const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://akbgnhtxlnchqjvqaypd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYmduaHR4bG5jaHFqdnFheXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTM0NjAsImV4cCI6MjEwMTA4OTQ2MH0.5yE1Ifv97RPwIf4DPm4IPD7EmBOposG7o_g-4U-8rYA');
async function run() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "Pagos Delete" ON pagos FOR DELETE 
      USING (
        (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'SUPERADMIN'
      );
    `
  });
  console.log('Result:', error || 'Success');
}
run();
