import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

// Strict in-memory token store so auth tokens never persist into browser localStorage/sessionStorage
const memoryStorageMap = new Map<string, string>();
const inMemoryStorage = {
  getItem: (key: string) => memoryStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorageMap.set(key, value);
  },
  removeItem: (key: string) => {
    memoryStorageMap.delete(key);
  },
};

let client: SupabaseClient | null = null;

export function isClientSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isClientSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: inMemoryStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
