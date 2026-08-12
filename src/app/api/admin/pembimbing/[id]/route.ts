import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isSuper(s: unknown) { return (s as { user?: { role?: string } })?.user?.role === "SUPERADMIN"; }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isSuper(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { name?: string; email?: string; siswaIds?: string[] } | null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "PEMBIMBING") return NextResponse.json({ error: "Pembimbing tidak ditemukan." }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (b?.name != null && String(b.name).trim()) data.name = String(b.name).trim();
  if (b?.email != null && String(b.email).trim()) data.email = String(b.email).trim().toLowerCase();
  if (Object.keys(data).length) await prisma.user.update({ where: { id }, data });
  if (Array.isArray(b?.siswaIds)) {
    await prisma.siswa.updateMany({ where: { pembimbingId: id }, data: { pembimbingId: null } });
    if (b.siswaIds.length) await prisma.siswa.updateMany({ where: { id: { in: b.siswaIds } }, data: { pembimbingId: id } });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isSuper(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "PEMBIMBING") return NextResponse.json({ error: "Pembimbing tidak ditemukan." }, { status: 404 });
  await prisma.siswa.updateMany({ where: { pembimbingId: id }, data: { pembimbingId: null } });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true, id });
}
