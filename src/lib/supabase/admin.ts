import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin client menggunakan service_role key.
 * HANYA boleh digunakan di server-side (API routes, server actions).
 * Jangan pernah expose ke client!
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
