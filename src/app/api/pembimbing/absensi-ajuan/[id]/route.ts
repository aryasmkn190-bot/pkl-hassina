import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const role = (session as unknown as { user?: { role: string } })?.user?.role;
  if (role !== "PEMBIMBING" && role !== "ADMIN" && role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { aksi?: string; feedback?: string } | null;
  const aksi = String(body?.aksi ?? "").toUpperCase();
  if (!["DISETUJUI", "DITOLAK"].includes(aksi)) return NextResponse.json({ error: "aksi harus DISETUJUI | DITOLAK" }, { status: 400 });
  const ajuan = await prisma.absensiAjuan.findUnique({ where: { id }, include: { siswa: true } });
  if (!ajuan) return NextResponse.json({ error: "Ajuan tidak ditemukan" }, { status: 404 });
  if (ajuan.status !== "MENUNGGU") return NextResponse.json({ error: "Ajuan sudah diproses" }, { status: 409 });
  // scope pembimbing: hanya bimbingannya
  if (role === "PEMBIMBING") {
    const pembId = (session as unknown as { user: { uid: string } }).user.uid;
    if (ajuan.siswa.pembimbingId !== pembId) return NextResponse.json({ error: "Forbidden — bukan siswa bimbingan Anda" }, { status: 403 });
  }
  if (aksi === "DITOLAK") {
    const u = await prisma.absensiAjuan.update({ where: { id }, data: { status: "DITOLAK", feedback: body?.feedback?.trim() || "Ditolak" } });
    return NextResponse.json({ ok: true, data: u });
  }
  // DISETUJUI -> buat Absensi sesuai type
  const map: Record<string, "HADIR" | "IZIN" | "SAKIT"> = { TERLEWAT: "HADIR", IZIN: "IZIN", SAKIT: "SAKIT" };
  const absensiStatus = map[ajuan.type] ?? "HADIR";
  // idempotent: jika sudah ada Absensi di tanggal itu, update status
  const existingAbs = await prisma.absensi.findUnique({ where: { siswaId_tanggal: { siswaId: ajuan.siswaId, tanggal: ajuan.tanggal } } });
  if (existingAbs) {
    await prisma.absensi.update({ where: { id: existingAbs.id }, data: { status: absensiStatus, catatan: ajuan.alasan } });
  } else {
    await prisma.absensi.create({ data: { siswaId: ajuan.siswaId, tanggal: ajuan.tanggal, status: absensiStatus, catatan: ajuan.alasan } });
  }
  const u = await prisma.absensiAjuan.update({ where: { id }, data: { status: "DISETUJUI" } });
  return NextResponse.json({ ok: true, data: u, absensiStatus });
}
