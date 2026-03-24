import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_DASHBOARD } from "@/lib/constants";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ambil data user yang sedang login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rute publik yang tidak memerlukan autentikasi
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  if (publicRoutes.includes(pathname)) {
    if (user) {
      // Jika sudah login, ambil role dan redirect ke dashboard yang sesuai
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        const dashboard = ROLE_DASHBOARD[profile.role] || "/login";
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }
    return supabaseResponse;
  }

  // Rute yang memerlukan autentikasi — redirect ke login jika belum login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Ambil profil pengguna untuk pengecekan role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Profil tidak ditemukan, paksa logout dan redirect ke login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Kontrol akses berbasis role (RBAC)
  if (pathname.startsWith("/siswa") && profile.role !== "siswa") {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARD[profile.role], request.url)
    );
  }
  if (
    pathname.startsWith("/guru") &&
    profile.role !== "guru_pembimbing"
  ) {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARD[profile.role], request.url)
    );
  }
  if (
    pathname.startsWith("/kajur") &&
    profile.role !== "ketua_jurusan"
  ) {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARD[profile.role], request.url)
    );
  }
  if (
    pathname.startsWith("/admin") &&
    profile.role !== "super_admin"
  ) {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARD[profile.role], request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path kecuali:
     * - _next/static  (file statis Next.js)
     * - _next/image   (optimisasi gambar Next.js)
     * - favicon.ico
     * - folder icons/
     * - file gambar (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
