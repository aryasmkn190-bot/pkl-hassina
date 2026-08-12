import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session as unknown as { user?: { role: string; uid: string } })?.user?.role;
  if (role !== "PEMBIMBING" && role !== "ADMIN" && role !== "SUPERADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "SEMUA";
  const take = Math.min(100, Number(url.searchParams.get("take") ?? 30));
  const q = url.searchParams.get("q")?.trim() ?? "";
  const tanggal = url.searchParams.get("tanggal")?.trim() ?? ""; // YYYY-MM-DD filter
  const where: Record<string, unknown> = {};
  if (status && status !== "SEMUA") (where as { status?: string }).status = status;
  if (tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    const d0 = new Date(tanggal+"T00:00:00+07:00"); const d1 = new Date(tanggal+"T23:59:59+07:00");
    (where as { tanggal?: { gte: Date; lte: Date } }).tanggal = { gte: d0, lte: d1 };
  }
  if (q) (where as { judul?: { contains: string; mode: string } }).judul = { contains: q, mode: "insensitive" };
  // scope pembimbing
  const user = (session as unknown as { user?: { uid: string; role: string } })?.user;
  if (user?.role === "PEMBIMBING") {
    const siswaIds = (await prisma.siswa.findMany({ where: { pembimbingId: user.uid }, select: { id: true } })).map((s) => s.id);
    if (siswaIds.length === 0) return NextResponse.json({ data: [] });
    (where as { siswaId?: { in: string[] } }).siswaId = { in: siswaIds };
  }
  const list = await prisma.jurnal.findMany({ where: where as never, orderBy: { createdAt: "desc" }, take, include: { siswa: { select: { nis: true, name: true, kelas: true, dudi: { select: { name: true } } } } } });
  const withCount = await Promise.all(list.map(async (j)=> {
    const c = await prisma.jurnalKomentar.count({ where: { jurnalId: j.id } });
    return { ...j, _count: { komentar: c } };
  }));
  return NextResponse.json({ data: withCount });
}
