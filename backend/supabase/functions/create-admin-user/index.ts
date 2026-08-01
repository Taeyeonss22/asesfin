import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify caller is ADMIN
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: perfil } = await supabaseClient
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'ADMIN') {
      throw new Error('Solo los administradores pueden crear usuarios.')
    }

    // Get request body
    const { email, password, nombre_completo, rol, zonas } = await req.json()

    // Init Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create User in Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre_completo }
    })

    if (createError) throw createError
    if (!newUser.user) throw new Error('User creation failed')

    // Wait a brief moment to ensure trigger completes
    await new Promise(resolve => setTimeout(resolve, 500))

    // 2. Update Role and Name in perfiles
    const { error: updateError } = await supabaseAdmin
      .from('perfiles')
      .update({ rol, nombre_completo })
      .eq('id', newUser.user.id)
    
    if (updateError) throw updateError

    // 3. Assign Zones if Cobrador
    if (rol === 'COBRADOR' && zonas && zonas.length > 0) {
      const zoneInserts = zonas.map((zid: string) => ({
        cobrador_id: newUser.user.id,
        zona_id: zid
      }))
      const { error: zoneError } = await supabaseAdmin
        .from('cobradores_zonas')
        .insert(zoneInserts)
      
      if (zoneError) throw zoneError
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
