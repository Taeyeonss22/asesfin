import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// We should use the same ENV vars or hardcoded here for testing if we don't have react-native-dotenv.
// Let's assume we can use the same variables, but React Native Expo doesn't load VITE_ automatically.
// We'll instruct the user to configure EXPO_PUBLIC_ variables or we'll just read them if they set them.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://reemplazar.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'REEMPLAZAR_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
