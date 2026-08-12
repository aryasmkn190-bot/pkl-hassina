import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

function needAdmin(session: unknown) {
  const r = (session as { user?: { role?: string } })?.user?.role;
  return r === "SUPERADMIN";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!needAdmin(session)) return NextResponse.json({ error: "Forbidden (SUPERADMIN only)" }, { status: 403 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const where = q
    ? { OR: [{ nis: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }, { kelas: { contains: q, mode: "insensitive" as const } }] }
    : {};
  const list = await prisma.siswa.findMany({ where: where as never, include: { dudi: { select: { id: true, name: true } }, pembimbing: { select: { name: true } } }, orderBy: { nis: "asc" }, take: 200 });
  return NextResponse.json({ data: list });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!needAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { nis?: string; name?: string; kelas?: string; jurusan?: string; dudiId?: string; pembimbingId?: string | null; password?: string } | null;
  const nis = String(body?.nis ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const kelas = String(body?.kelas ?? "").trim();
  const jurusan = String(body?.jurusan ?? "").trim();
  const dudiId = String(body?.dudiId ?? "").trim();
  if (!nis || !name || !kelas || !dudiId) return NextResponse.json({ error: "nis, name, kelas, dudiId wajib." }, { status: 400 });
  const dudi = await prisma.dudi.findUnique({ where: { id: dudiId } });
  if (!dudi) return NextResponse.json({ error: "DUDI tidak ditemukan." }, { status: 404 });
  const pw = String(body?.password ?? "123456");
  const passwordHash = await hash(pw, 10);
  const user = await prisma.user.create({ data: { role: "SISWA", nis, name, passwordHash, mustChangePassword: true } });
  const siswa = await prisma.siswa.create({
    data: { nis, name, kelas, jurusan: jurusan || "-", dudiId, pembimbingId: body?.pembimbingId || null },
  });
  return NextResponse.json({ ok: true, userId: user.id, siswa });
}
