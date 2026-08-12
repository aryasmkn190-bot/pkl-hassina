import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session as unknown as { user?: { role: string } })?.user?.role;
  if (!role || role !== "SISWA") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const nis = (session as unknown as { user: { nis: string } }).user.nis;
  const siswa = await prisma.siswa.findUnique({ where: { nis }, include: { dudi: true } });
  if (!siswa) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: siswa });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session as unknown as { user?: { role: string } })?.user?.role;
  if (!role || role !== "SISWA") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const nis = (session as unknown as { user: { nis: string } }).user.nis;
  const body = await req.json().catch(() => null) as null | { name?: string; kelas?: string; jurusan?: string; noHp?: string; foto?: string; dudi?: { pimpinan?: string; alamat?: string; noTelp?: string } };
  if (!body) return NextResponse.json({ error: "Body kosong" }, { status: 400 });

  const siswa = await prisma.siswa.findUnique({ where: { nis }, include: { dudi: true } });
  if (!siswa) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.kelas === "string" && body.kelas.trim()) data.kelas = body.kelas.trim();
  if (typeof body.jurusan === "string" && body.jurusan.trim()) data.jurusan = body.jurusan.trim();
  if (typeof body.noHp === "string") data.noHp = body.noHp.trim() || null;
  if (typeof body.foto === "string") data.foto = body.foto.trim() || null;

  let updated = siswa;
  if (Object.keys(data).length) updated = await prisma.siswa.update({ where: { nis }, data, include: { dudi: true } });

  if (body.dudi && typeof body.dudi === "object") {
    const dd: Record<string, unknown> = {};
    if (typeof body.dudi.pimpinan === "string") dd.pimpinan = body.dudi.pimpinan.trim() || null;
    if (typeof body.dudi.alamat === "string" && body.dudi.alamat.trim()) dd.alamat = body.dudi.alamat.trim();
    if (typeof body.dudi.noTelp === "string") dd.noTelp = body.dudi.noTelp.trim() || null;
    if (Object.keys(dd).length) {
      await prisma.dudi.update({ where: { id: siswa.dudiId }, data: dd });
      updated = await prisma.siswa.findUnique({ where: { nis }, include: { dudi: true } }) as typeof updated;
    }
  }

  return NextResponse.json({ ok: true, data: updated });
}
