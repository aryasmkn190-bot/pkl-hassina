import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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

  const pathname = request.nextUrl.pathname;

  // Rute publik — tidak perlu cek auth
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return supabaseResponse;
  }

  // Hanya cek apakah session ada via cookie (tanpa hit ke Supabase server)
  // getUser() digunakan untuk validasi token secara aman
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Belum login — redirect ke login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control sekarang ditangani di masing-masing layout (client-side)
  // agar tidak perlu query DB di setiap request middleware
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path kecuali:
     * - _next/static & _next/image (asset Next.js)
     * - favicon.ico, icons/, screenshot/
     * - file gambar statis
     * - template Excel & file publik lain
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|screenshots|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xlsx|ico)$).*)",
  ],
};
