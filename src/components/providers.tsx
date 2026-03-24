"use client";

import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

/* ─────────────────────────────────────────────────────────
   TanStack Query client (singleton per render)
───────────────────────────────────────────────────────── */

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data dianggap fresh selama 30 detik
        staleTime: 30 * 1000,
        // Cache bertahan 5 menit
        gcTime: 5 * 60 * 1000,
        // Retry sekali jika gagal
        retry: 1,
        // Refetch saat window focus kembali
        refetchOnWindowFocus: true,
        // Refetch saat reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: selalu buat client baru
    return makeQueryClient();
  }
  // Browser: gunakan singleton agar data tidak hilang antar render
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

/* ─────────────────────────────────────────────────────────
   Auth Listener — sinkronisasi sesi Supabase ke store
───────────────────────────────────────────────────────── */

function AuthListener() {
  const router = useRouter();
  const { setUser, setProfile, setLoading, clearAuth } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    // Timeout fallback — jika getSession tidak selesai dalam 5 detik, paksa loading false
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("[AuthListener] getSession timeout — forcing loading false");
        setLoading(false);
      }
    }, 5000);

    const init = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          console.error("[AuthListener] getSession error:", error.message);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (!cancelled && profile) {
            setProfile(profile);
          }
        }
      } catch (err) {
        console.error("[AuthListener] unexpected error:", err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    };

    init();

    // Dengarkan perubahan auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile) setProfile(profile);
        setLoading(false);
        router.refresh();
      }

      if (event === "SIGNED_OUT") {
        clearAuth();
        router.push("/login");
        router.refresh();
      }

      if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/* ─────────────────────────────────────────────────────────
   Root Providers
───────────────────────────────────────────────────────── */

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        {/* Auth state listener */}
        <AuthListener />

        {/* App content */}
        {children}

        {/* Toast notifications */}
        <Toaster
          position="top-center"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: 500,
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.06)",
              maxWidth: "calc(100vw - 2rem)",
            },
            className: "tap-highlight-none",
          }}
          expand={false}
          visibleToasts={3}
        />

        {/* Devtools hanya di development */}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
