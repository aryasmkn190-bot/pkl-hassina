import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function todayStrWIB(): string {
  return new Date().toLocaleString("en-CA", { timeZone: "Asia/Jakarta" }).slice(0,10);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const j = await prisma.jurnal.findUnique({ where: { id }, include: { siswa: { select: { nis: true, name: true, kelas: true, pembimbingId: true, dudi: { select: { name: true } } } } } });
  if (!j) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  // auth: siswa pemilik, pembimbing ybs, admin/superadmin
  const role = session.user.role as string;
  const uid = session.user.uid as string;
  const nis = session.user.nis as string | undefined;
  const isOwner = nis && j.siswa.nis === nis;
  const isPembimbing = role === "PEMBIMBING" && j.siswa.pembimbingId === uid;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
  if (!isOwner && !isPembimbing && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const komentar = await prisma.jurnalKomentar.findMany({ where: { jurnalId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ ok: true, data: j, komentar });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const j = await prisma.jurnal.findUnique({ where: { id }, include: { siswa: { select: { nis: true, pembimbingId: true } } } });
  if (!j) return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });
  const role = session.user.role as string;
  const uid = session.user.uid as string;
  const nis = session.user.nis as string | undefined;
  const name = (session.user.name as string) || "User";
  const isOwner = nis && j.siswa.nis === nis;
  const isPembimbing = role === "PEMBIMBING" && j.siswa.pembimbingId === uid;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
  if (!isOwner && !isPembimbing && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { isi?: string; parentId?: string } | null;
  const isi = String(body?.isi ?? "").trim();
  if (isi.length < 2 || isi.length > 1000) return NextResponse.json({ error: "Komentar 2-1000 karakter." }, { status: 400 });
  let parentId: string | null = body?.parentId ? String(body.parentId) : null;
  if (parentId) {
    const parent = await prisma.jurnalKomentar.findUnique({ where: { id: parentId } });
    if (!parent || parent.jurnalId !== id) return NextResponse.json({ error: "Parent tidak valid." }, { status: 400 });
  }
  // normalize role enum
  const roleEnum = (role === "PEMBIMBING" ? "PEMBIMBING" : role === "SUPERADMIN" ? "SUPERADMIN" : role === "ADMIN" ? "ADMIN" : "SISWA") as never;
  const siswaId = j.siswaId;
  const row = await prisma.jurnalKomentar.create({ data: { jurnalId: id, siswaId, authorId: uid, authorRole: roleEnum, authorName: name, isi, parentId } as any });
  return NextResponse.json({ ok: true, data: row });
}
