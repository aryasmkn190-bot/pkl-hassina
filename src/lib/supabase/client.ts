import { createBrowserClient } from "@supabase/ssr";

/**
 * Membuat Supabase client untuk digunakan di sisi browser (Client Components).
 * Gunakan fungsi ini di dalam komponen React atau hooks.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
