import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the caller is an authenticated admin
    const supabase = await createClient();
    const { data: { user: caller } } = await supabase.auth.getUser();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check caller role
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: only super_admin can create users" }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json();
    const { email, password, full_name, role, phone } = body;

    if (!email?.trim() || !password?.trim() || !full_name?.trim()) {
      return NextResponse.json({ error: "Email, password, dan nama lengkap wajib diisi" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    const validRoles = ["siswa", "guru_pembimbing", "ketua_jurusan", "super_admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Role tidak valid: ${role}` }, { status: 400 });
    }

    // 3. Create user with Admin API (instant, no email confirmation)
    const adminClient = createAdminClient();
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Auto-confirm, no email sent
      user_metadata: {
        full_name: full_name.trim(),
        role: role,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 4. Update profile with role & phone
    if (newUser.user) {
      await adminClient
        .from("profiles")
        .update({
          full_name: full_name.trim(),
          role: role,
          phone: phone?.trim() || null,
        })
        .eq("id", newUser.user.id);
    }

    return NextResponse.json({
      success: true,
      user: { id: newUser.user.id, email: newUser.user.email },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
