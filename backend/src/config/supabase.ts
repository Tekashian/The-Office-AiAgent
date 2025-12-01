import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { logger } from '../utils/logger';

// Anon client - for operations WITH RLS (uses user's JWT)
export const supabase: SupabaseClient = createClient(
  config.database.url,
  config.database.anonKey
);

// Admin client - for operations BYPASSING RLS (uses service role key)
export const supabaseAdmin: SupabaseClient = createClient(
  config.database.url,
  config.database.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

logger.info('Supabase clients initialized', {
  url: config.database.url,
});

export default supabase;
