require('dotenv').config({ path: 'frontend/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  let { data, error } = await supabase.from('creditos').select('*');
  console.log('Creditos:', data?.length);
  if (data?.length > 0) console.log(data.map(c => c.id));
}
run();
