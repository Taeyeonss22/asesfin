require('dotenv').config({ path: '../frontend/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
// We can't query directly because of RLS, but we can call a function or look at the schema using postgres schema query
