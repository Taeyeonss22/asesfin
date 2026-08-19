require('dotenv').config({ path: 'frontend/.env' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeDatabase() {
  console.log("Iniciando borrado de datos de prueba...");

  const tablesToWipe = [
    'pagos',
    'integrantes_grupo',
    'creditos',
    'cortes_diarios',
    'grupos',
    'clientes'
  ];

  for (const table of tablesToWipe) {
    console.log(`Borrando registros de ${table}...`);
    // Delete all rows where id is not null (which means all rows)
    const { data, error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error(`Error al borrar ${table}:`, error.message);
    } else {
      console.log(`✅ ${table} limpiada con éxito.`);
    }
  }

  // Verificar
  console.log("Verificando que las tablas estén vacías...");
  for (const table of tablesToWipe) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error consultando ${table}:`, error.message);
    } else {
      console.log(`Total en ${table}: ${count}`);
    }
  }

  console.log("¡Limpieza de base de datos terminada!");
}

wipeDatabase();
