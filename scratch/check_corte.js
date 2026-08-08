import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('frontend/.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: cortes } = await supabase.from('cortes_diarios').select('id, fecha').order('fecha', {ascending: false}).limit(5);
  console.log("Cortes:", cortes);
  
  if (cortes && cortes.length > 0) {
      const { data: pagos } = await supabase.from('pagos').select('id, corte_id').eq('corte_id', cortes[0].id);
      console.log("Pagos del corte reciente:", pagos?.length);
  }
}

run();
