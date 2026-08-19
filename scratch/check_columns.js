require('dotenv').config({ path: 'frontend/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('plantillas_contratos').select('*').limit(1);
  console.log(data);
}
run();
