import { createClient as createSb } from '@supabase/supabase-js';

/**
 * Stateless anon Supabase client (no cookies). Uses RLS as an anonymous caller.
 */
export function createAnonSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / ANON_KEY are required.',
    );
  }
  return createSb(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createAnonServerClient() {
  return createAnonSupabaseServer();
}
