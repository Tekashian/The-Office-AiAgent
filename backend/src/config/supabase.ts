import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found in environment variables');
}

// Anon client - for operations WITH RLS (uses user's JWT)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client - for operations BYPASSING RLS (uses service role key)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;
