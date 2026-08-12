import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

function isSuper(s: unknown) { return (s as { user?: { role?: string } })?.user?.role === "SUPERADMIN"; }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isSuper(session)) return NextResponse.json({ error: "Forbidden (SUPERADMIN only)" }, { status: 403 });
  const list = await prisma.user.findMany({ where: { role: "PEMBIMBING" }, select: { id: true, name: true, email: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  // hitung bimbingan
  const all = await Promise.all(list.map(async (u) => ({ ...u, _count: { siswa: await prisma.siswa.count({ where: { pembimbingId: u.id } }) } })));
  return NextResponse.json({ data: all });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isSuper(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { name?: string; email?: string; password?: string } | null;
  const name = String(b?.name ?? "").trim();
  const email = String(b?.email ?? "").trim().toLowerCase();
  const pw = String(b?.password ?? "pembimbing123");
  if (!name || !email || !email.includes("@")) return NextResponse.json({ error: "name & email valid wajib." }, { status: 400 });
  if (pw.length < 6) return NextResponse.json({ error: "Password minimal 6." }, { status: 400 });
  const exist = await prisma.user.findUnique({ where: { email } });
  if (exist) return NextResponse.json({ error: "Email sudah terpakai." }, { status: 409 });
  const user = await prisma.user.create({ data: { role: "PEMBIMBING", name, email, passwordHash: await hash(pw, 10), mustChangePassword: false } });
  return NextResponse.json({ ok: true, data: { id: user.id, name, email, password: pw } });
}
