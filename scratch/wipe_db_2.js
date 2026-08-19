require('dotenv').config({ path: 'frontend/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function wipeRemaining() {
  for (const table of ['grupos', 'clientes']) {
    console.log(`Borrando ${table}...`);
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error(`Error:`, error.message);
    else console.log(`Exito`);
  }
}
wipeRemaining();
