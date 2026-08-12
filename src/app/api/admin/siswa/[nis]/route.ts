import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: unknown) { return (s as { user?: { role?: string } })?.user?.role === "SUPERADMIN"; }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ nis: string }> }) {
  const { nis } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { name?: string; kelas?: string; jurusan?: string; dudiId?: string } | null;
  const name = body?.name != null ? String(body.name).trim() : undefined;
  const kelas = body?.kelas != null ? String(body.kelas).trim() : undefined;
  const jurusan = body?.jurusan != null ? String(body.jurusan).trim() : undefined;
  const dudiId = body?.dudiId != null ? String(body.dudiId).trim() : undefined;
  const siswa = await prisma.siswa.findUnique({ where: { nis } });
  if (!siswa) return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
  if (dudiId) {
    const dudi = await prisma.dudi.findUnique({ where: { id: dudiId } });
    if (!dudi) return NextResponse.json({ error: "DUDI tidak ditemukan." }, { status: 404 });
  }
  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (kelas) data.kelas = kelas;
  if (jurusan != null) data.jurusan = jurusan || "-";
  if (dudiId) data.dudiId = dudiId;
  const updated = await prisma.siswa.update({ where: { nis }, data });
  if (name) await prisma.user.updateMany({ where: { nis }, data: { name } });
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ nis: string }> }) {
  const { nis } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const siswa = await prisma.siswa.findUnique({ where: { nis } });
  if (!siswa) return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
  await prisma.jurnal.deleteMany({ where: { siswaId: siswa.id } });
  await prisma.absensi.deleteMany({ where: { siswaId: siswa.id } });
  await prisma.siswa.delete({ where: { id: siswa.id } });
  await prisma.user.deleteMany({ where: { nis } });
  return NextResponse.json({ ok: true, nis });
}
