import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Bypass navigator.locks (Web Locks API) which causes
        // "Lock broken by another request" errors in React Strict Mode.
        // This disables cross-tab token refresh coordination but is fine
        // for single-tab usage.
        lock: async (name: string, acquireTimeout: number, fn: () => Promise<unknown>) => {
          return await fn();
        },
      },
    }
  );

  return client;
}
