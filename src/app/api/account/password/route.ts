import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = (session as unknown as { user?: { uid: string } })?.user;
  if (!user?.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null) as { currentPassword?: string; newPassword?: string } | null;
  const cur = String(body?.currentPassword ?? "");
  const nxt = String(body?.newPassword ?? "");
  if (!cur || !nxt) return NextResponse.json({ error: "currentPassword & newPassword wajib." }, { status: 400 });
  if (nxt.length < 6) return NextResponse.json({ error: "Password baru minimal 6 karakter." }, { status: 400 });
  const u = await prisma.user.findUnique({ where: { id: user.uid } });
  if (!u) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  if (!(await compare(cur, u.passwordHash))) return NextResponse.json({ error: "Password lama salah." }, { status: 400 });
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hash(nxt, 10), mustChangePassword: false } });
  return NextResponse.json({ ok: true });
}
