import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

function isAdmin(s: unknown) { return (s as { user?: { role?: string } })?.user?.role === "SUPERADMIN"; }

export async function POST(req: NextRequest, { params }: { params: Promise<{ nis: string }> }) {
  const { nis } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  const pw = String(body?.password ?? "123456");
  if (pw.length < 6) return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { nis } });
  if (!user) return NextResponse.json({ error: "User NIS tidak ditemukan." }, { status: 404 });
  await prisma.user.update({ where: { nis }, data: { passwordHash: await hash(pw, 10), mustChangePassword: true } });
  return NextResponse.json({ ok: true, nis, password: pw });
}
