import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: unknown) { return (s as { user?: { role?: string } })?.user?.role === "SUPERADMIN"; }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const list = await prisma.dudi.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { siswa: true } } } });
  return NextResponse.json({ data: list });
}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { name?: string; alamat?: string; kategori?: string; deskripsi?: string; pimpinan?: string; noTelp?: string; lat?: number; lng?: number; radiusM?: number; kuota?: number } | null;
  const name = String(b?.name ?? "").trim();
  const alamat = String(b?.alamat ?? "").trim();
  const kategori = b?.kategori ? String(b.kategori).trim() || null : null;
  const deskripsi = b?.deskripsi ? String(b.deskripsi).trim() || null : null;
  const pimpinan = b?.pimpinan ? String(b.pimpinan).trim() || null : null;
  const noTelp = b?.noTelp ? String(b.noTelp).trim() || null : null;
  if (!name || !alamat) return NextResponse.json({ error: "name & alamat wajib." }, { status: 400 });
  const lat = typeof b?.lat === "number" ? b.lat : -6.9;
  const lng = typeof b?.lng === "number" ? b.lng : 106.9;
  const radiusM = typeof b?.radiusM === "number" ? b.radiusM : 150;
  const kuota = typeof b?.kuota === "number" ? b.kuota : 10;
  const dudi = await prisma.dudi.create({ data: { name, alamat, kategori, deskripsi, pimpinan, noTelp, lat, lng, radiusM, kuota } });
  return NextResponse.json({ ok: true, data: dudi });
}
