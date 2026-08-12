import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: unknown) { return (s as { user?: { role?: string } })?.user?.role === "SUPERADMIN"; }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { name?: string; alamat?: string; kategori?: string; deskripsi?: string; pimpinan?: string; noTelp?: string; lat?: number; lng?: number; radiusM?: number; kuota?: number } | null;
  const dudi = await prisma.dudi.findUnique({ where: { id } });
  if (!dudi) return NextResponse.json({ error: "DUDI tidak ditemukan." }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (body?.name != null && String(body.name).trim()) data.name = String(body.name).trim();
  if (body?.alamat != null && String(body.alamat).trim()) data.alamat = String(body.alamat).trim();
  if (body?.kategori !== undefined) data.kategori = body.kategori ? String(body.kategori).trim() || null : null;
  if (body?.deskripsi !== undefined) data.deskripsi = body.deskripsi ? String(body.deskripsi).trim() || null : null;
  if (body?.pimpinan !== undefined) data.pimpinan = body.pimpinan ? String(body.pimpinan).trim() || null : null;
  if (body?.noTelp !== undefined) data.noTelp = body.noTelp ? String(body.noTelp).trim() || null : null;
  if (typeof body?.lat === "number") data.lat = body.lat;
  if (typeof body?.lng === "number") data.lng = body.lng;
  if (typeof body?.radiusM === "number") data.radiusM = body.radiusM;
  if (typeof body?.kuota === "number") data.kuota = body.kuota;
  const updated = await prisma.dudi.update({ where: { id }, data });
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const dudi = await prisma.dudi.findUnique({ where: { id }, include: { _count: { select: { siswa: true } } } });
  if (!dudi) return NextResponse.json({ error: "DUDI tidak ditemukan." }, { status: 404 });
  if (dudi._count.siswa > 0) return NextResponse.json({ error: `DUDI masih terisi ${dudi._count.siswa} siswa — pindahkan dulu.` }, { status: 409 });
  await prisma.dudi.delete({ where: { id } });
  return NextResponse.json({ ok: true, id });
}
