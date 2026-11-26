import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerConfig } from './config.ts';

let cachedAdmin: SupabaseClient | null = null;
let cachedSignature = '';

export function getSupabaseAdmin(): SupabaseClient | null {
  const cfg = getServerConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey) {
    return null;
  }

  const signature = `${cfg.supabaseUrl}:${cfg.supabaseServiceRoleKey.slice(0, 8)}`;
  if (!cachedAdmin || cachedSignature !== signature) {
    cachedAdmin = createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    cachedSignature = signature;
  }

  return cachedAdmin;
}

export class ConfigurationRequiredError extends Error {
  public readonly statusCode = 503;
  public readonly missingVars: string[];

  constructor(message: string, missingVars: string[]) {
    super(message);
    this.name = 'ConfigurationRequiredError';
    this.missingVars = missingVars;
  }
}

export function requireSupabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new ConfigurationRequiredError(
      'Database persistence and authentication require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be configured on the server.',
      ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    );
  }
  return client;
}
