import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const { data: config, error: configErr } = await supabase.from('configuracion_empresa').select('*').limit(1).single();
  console.log("Config:", config, configErr);

  // We need an ID of a credit or payment to test. 
  // I will just select one to see if joins work.
  const { data: pago, error: pagoErr } = await supabase
    .from('pagos')
    .select(`
      *,
      perfiles(nombre_completo),
      creditos(tipo, nombre_cliente, periodicidad, cuota_periodo),
      integrantes_grupo(nombre_completo)
    `)
    .limit(1)
    .single();
    
  console.log("Pago:", pago, pagoErr);
}
testFetch();
