import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

let _client: SupabaseClient | null = null;

/**
 * Backend Supabase client using the SERVICE ROLE key.
 * NEVER expose this client or key to the frontend.
 */
export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    logger.warn(
      'Supabase service-role credentials are missing. DB calls will fail until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  _client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}