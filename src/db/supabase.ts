import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { deleteKv, getKv, setKv } from './repo';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** La sesión vive en el sandbox de la app, en la misma base local. */
const sessionStorage = {
  getItem: async (key: string) => getKv(`auth:${key}`),
  setItem: async (key: string, value: string) => setKv(`auth:${key}`, value),
  removeItem: async (key: string) => deleteKv(`auth:${key}`),
};

/** Null mientras no estén configuradas las variables de entorno. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: sessionStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;
