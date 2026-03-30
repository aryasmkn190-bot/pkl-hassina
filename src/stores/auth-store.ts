import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types";

/* ─────────────────────────────────────────────────────────
   State & Actions
───────────────────────────────────────────────────────── */

interface AuthState {
  // Data
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isHydrated: boolean;

  // Computed helpers
  isAuthenticated: boolean;
  role: UserRole | null;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  clearAuth: () => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

/* ─────────────────────────────────────────────────────────
   Store
───────────────────────────────────────────────────────── */

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────
      user: null,
      profile: null,
      isLoading: true,
      isHydrated: false,
      isAuthenticated: false,
      role: null,

      // ── Actions ────────────────────────────────────────

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setProfile: (profile) =>
        set({
          profile,
          role: profile?.role ?? null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setHydrated: (isHydrated) => set({ isHydrated }),

      clearAuth: () =>
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
        }),

      updateProfile: (updates) => {
        const current = get().profile;
        if (!current) return;
        const updated = { ...current, ...updates };
        set({
          profile: updated,
          role: updated.role ?? current.role,
        });
      },
    }),
    {
      name: "pkl-hassina-auth",
      storage: createJSONStorage(() => {
        // Gunakan sessionStorage agar otomatis bersih saat tab ditutup
        if (typeof window !== "undefined") {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Hanya persist data yang diperlukan (bukan loading state)
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);

/* ─────────────────────────────────────────────────────────
   Selector Hooks (optimized — hindari re-render berlebihan)
───────────────────────────────────────────────────────── */

/** Dapatkan user Supabase */
export const useUser = () => useAuthStore((s) => s.user);

/** Dapatkan profil lengkap */
export const useProfile = () => useAuthStore((s) => s.profile);

/** Dapatkan role pengguna */
export const useRole = () => useAuthStore((s) => s.role);

/** Cek apakah sudah login */
export const useIsAuthenticated = () =>
  useAuthStore((s) => s.isAuthenticated);

/** Cek apakah sedang loading auth */
export const useIsAuthLoading = () => useAuthStore((s) => s.isLoading);

/** Cek apakah store sudah terhidrasi dari localStorage */
export const useIsHydrated = () => useAuthStore((s) => s.isHydrated);

/** Dapatkan nama lengkap user */
export const useFullName = () =>
  useAuthStore((s) => s.profile?.full_name ?? "");

/** Dapatkan avatar URL */
export const useAvatarUrl = () =>
  useAuthStore((s) => s.profile?.avatar_url ?? null);

/** Cek role helper */
export const useIsSiswa = () => useAuthStore((s) => s.role === "siswa");
export const useIsGuru = () =>
  useAuthStore((s) => s.role === "guru_pembimbing");
export const useIsKajur = () =>
  useAuthStore((s) => s.role === "ketua_jurusan");
export const useIsAdmin = () => useAuthStore((s) => s.role === "super_admin");

/** Cek apakah role termasuk dalam daftar yang diizinkan */
export const useHasRole = (roles: UserRole[]) =>
  useAuthStore((s) => s.role !== null && roles.includes(s.role));
