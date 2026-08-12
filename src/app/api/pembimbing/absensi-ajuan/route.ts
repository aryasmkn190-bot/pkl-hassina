import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session as unknown as { user?: { role: string } })?.user?.role;
  if (role !== "PEMBIMBING" && role !== "ADMIN" && role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pembimbingId = (session as unknown as { user?: { uid: string } })?.user?.uid ?? "";
  const siswaWhere: Record<string, unknown> = {};
  if (role === "PEMBIMBING") siswaWhere.pembimbingId = pembimbingId;
  const siswaIds = role === "PEMBIMBING" ? (await prisma.siswa.findMany({ where: siswaWhere, select: { id: true } })).map((s) => s.id) : undefined;
  const where: Record<string, unknown> = siswaIds ? { siswaId: { in: siswaIds } } : {};
  const status = req.nextUrl.searchParams.get("status");
  if (status) where.status = status;
  const list = await prisma.absensiAjuan.findMany({ where, orderBy: { createdAt: "desc" }, take: 50, include: { siswa: { select: { nis: true, name: true, kelas: true, dudi: { select: { name: true } } } } } });
  return NextResponse.json({ data: list });
}
