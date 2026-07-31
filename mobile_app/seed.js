const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function createCobrador() {
  const email = 'cobrador@microcreditos.com';
  const password = 'password123';

  console.log('Creando usuario cobrador...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre_completo: 'Cobrador de Prueba'
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('El usuario ya existe, intentando iniciar sesión...');
      await supabase.auth.signInWithPassword({ email, password });
    } else {
      console.error('Error creando usuario:', error);
      return;
    }
  }

  // Get current user id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No se pudo obtener el usuario');
    return;
  }

  console.log('Usuario creado/logueado con ID:', user.id);
  console.log('Intentando actualizar el rol a COBRADOR mediante la política "propio perfil"...');
  
  const { error: updateError } = await supabase
    .from('perfiles')
    .update({ rol: 'COBRADOR' })
    .eq('id', user.id);

  if (updateError) {
    console.error('No se pudo actualizar el rol. Esto es normal por seguridad. El administrador debe hacerlo desde la web.', updateError);
  } else {
    console.log('¡Éxito! Rol actualizado a COBRADOR.');
    
    // Attempt to assign to first zone
    const { data: zonas } = await supabase.from('zonas').select('*').limit(1);
    if (zonas && zonas.length > 0) {
      await supabase.from('cobradores_zonas').insert({
        cobrador_id: user.id,
        zona_id: zonas[0].id
      });
      console.log('Zona asignada automáticamente:', zonas[0].nombre);
    }
  }
  
  console.log('\\n--- CREDENCIALES DE PRUEBA ---');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('--------------------------------');
}

createCobrador();
