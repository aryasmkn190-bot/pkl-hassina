import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

function isAdmin(s: unknown) { return (s as { user?: { role?: string } })?.user?.role === "SUPERADMIN"; }

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { text?: string; dudiId?: string } | null;
  const text = String(body?.text ?? "").trim();
  const fallbackDudiId = body?.dudiId ? String(body.dudiId) : null;
  if (!text) return NextResponse.json({ error: "text (CSV) wajib. Format: nis,nama,kelas,jurusan,dudiId (header opsional)" }, { status: 400 });
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let start = 0;
  if (lines[0] && /nis/i.test(lines[0]) && /nama/i.test(lines[0])) start = 1;
  const errors: string[] = [];
  let ok = 0, skipped = 0;
  for (let i = start; i < lines.length; i++) {
    const raw = lines[i];
    const cols = raw.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [nis, name, kelas, jurusan, dudiIdRaw] = cols;
    const dudiId = (dudiIdRaw ?? fallbackDudiId ?? "").trim();
    if (!nis || !name || !kelas) { errors.push(`baris ${i + 1}: nis/nama/kelas kosong`); continue; }
    if (!dudiId) { errors.push(`baris ${i + 1} ${nis}: dudiId kosong`); continue; }
    const dudi = await prisma.dudi.findUnique({ where: { id: dudiId } });
    if (!dudi) { errors.push(`baris ${i + 1} ${nis}: DUDI ${dudiId} tidak ditemukan`); continue; }
    const existSiswa = await prisma.siswa.findUnique({ where: { nis } });
    if (existSiswa) { skipped++; continue; }
    const existUser = await prisma.user.findUnique({ where: { nis } });
    if (existUser) { errors.push(`baris ${i + 1} ${nis}: nis sudah dipakai user lain`); continue; }
    await prisma.user.create({ data: { role: "SISWA", nis, name, passwordHash: await hash("123456", 10), mustChangePassword: true } });
    await prisma.siswa.create({ data: { nis, name, kelas, jurusan: (jurusan ?? "-").trim() || "-", dudiId } });
    ok++;
  }
  return NextResponse.json({ ok: true, imported: ok, skipped, errors: errors.slice(0, 30) });
}
