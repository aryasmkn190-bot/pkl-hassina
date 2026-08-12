import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// legacy approve/revisi tetap didukung untuk pembimbing (jika dipanggil)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = (session as unknown as { user?: { uid: string; role: string; nis?: string } })?.user;
  if (!user?.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null) as { action?: string; feedback?: string } | null;
  const action = body?.action;
  if (action === "approve" || action === "revisi") {
    if (user.role !== "PEMBIMBING" && user.role !== "ADMIN" && user.role !== "SUPERADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const feedback = body?.feedback ? String(body.feedback) : null;
    const status = action === "approve" ? "DISETUJUI" : "REVISI";
    const j = await prisma.jurnal.update({ where: { id }, data: { status: status as never, feedback } });
    return NextResponse.json({ ok: true, data: j });
  }
  return NextResponse.json({ error: "action harus approve/revisi" }, { status: 400 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = (session as unknown as { user?: { uid: string; role: string; nis?: string } })?.user;
  if (!user?.uid || user.role !== "SISWA") return NextResponse.json({ error: "Forbidden — hanya siswa pemilik." }, { status: 403 });
  const siswa = await prisma.siswa.findFirst({ where: { nis: user.nis } });
  if (!siswa) return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
  const j = await prisma.jurnal.findUnique({ where: { id } });
  if (!j || j.siswaId !== siswa.id) return NextResponse.json({ error: "Jurnal tidak ditemukan." }, { status: 404 });
  // DISETUJUI tetap bisa diedit (sesuai permintaan baru)

  const ct = req.headers.get("content-type") ?? "";
  let judul = "", kegiatan = "", kendala: string | null = null, jamMulai: string | null = null, jamSelesai: string | null = null;
  let keepFoto: string[] | null = null;
  let newFotoPaths: string[] = [];
  let tanggal: Date | null = null;

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    judul = String(form.get("judul") ?? "").trim();
    kegiatan = String(form.get("kegiatan") ?? "").trim();
    kendala = form.get("kendala") ? String(form.get("kendala")).trim() || null : null;
    jamMulai = form.get("jamMulai") ? String(form.get("jamMulai")) : null;
    jamSelesai = form.get("jamSelesai") ? String(form.get("jamSelesai")) : null;
    const tanggalRaw = form.get("tanggal") ? String(form.get("tanggal")).trim() : null;
    if (tanggalRaw && /^\d{4}-\d{2}-\d{2}$/.test(tanggalRaw)) tanggal = new Date(tanggalRaw + "T12:00:00+07:00");
    const keepRaw = form.get("keepFoto");
    if (keepRaw) { try { const arr = JSON.parse(String(keepRaw)); if (Array.isArray(arr)) keepFoto = arr.map(String); } catch {} }
    const files = form.getAll("foto") as unknown as File[];
    const uploadDir = process.env.UPLOAD_DIR ?? "/var/lib/pkl-hassina/uploads";
    const day = tanggalRaw && /^\d{4}-\d{2}-\d{2}$/.test(tanggalRaw) ? tanggalRaw : new Date(j.tanggal).toISOString().slice(0,10);
    for (const f of files) {
      if (!f || !(f as File).arrayBuffer || (f as File).size===0) continue;
      if ((f as File).size > 5*1024*1024) continue;
      if (newFotoPaths.length + (keepFoto?.length ?? (j.foto as string[]).length) >= 5) break;
      const buf = Buffer.from(await (f as File).arrayBuffer());
      const dir = path.join(uploadDir, "jurnal", siswa.nis, day);
      await mkdir(dir, { recursive: true });
      const name = `j-${Date.now()}-${randomUUID().slice(0,5)}.jpg`;
      await writeFile(path.join(dir, name), buf);
      newFotoPaths.push(`/uploads/jurnal/${siswa.nis}/${day}/${name}`);
    }
  } else {
    const body = await req.json().catch(() => null) as { judul?: string; kegiatan?: string; kendala?: string; jamMulai?: string; jamSelesai?: string; tanggal?: string; keepFoto?: string[] } | null;
    judul = String(body?.judul ?? "").trim();
    kegiatan = String(body?.kegiatan ?? "").trim();
    kendala = body?.kendala != null ? String(body.kendala).trim() || null : null;
    jamMulai = body?.jamMulai ? String(body.jamMulai) : null;
    jamSelesai = body?.jamSelesai ? String(body.jamSelesai) : null;
    if (body?.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(String(body.tanggal))) tanggal = new Date(String(body.tanggal) + "T12:00:00+07:00");
    if (Array.isArray(body?.keepFoto)) keepFoto = body.keepFoto.map(String);
  }

  if (!judul || !kegiatan) return NextResponse.json({ error: "Judul & uraian kegiatan wajib." }, { status: 400 });

  // foto final: keepFoto (subset lama) + new
  let fotoFinal: string[] | undefined;
  if (keepFoto !== null || newFotoPaths.length > 0) {
    const base = keepFoto !== null ? keepFoto : ((j.foto as unknown as string[]) ?? []);
    fotoFinal = [...base, ...newFotoPaths].slice(0, 5);
  }

  const data: Record<string, unknown> = { judul, kegiatan, kendala, jamMulai, jamSelesai };
  if (tanggal) (data as { tanggal: Date }).tanggal = tanggal;
  if (fotoFinal !== undefined) (data as { foto: string[] }).foto = fotoFinal;

  const updated = await prisma.jurnal.update({ where: { id }, data: data as never });
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = (session as unknown as { user?: { uid: string; role: string; nis?: string } })?.user;
  if (!user?.uid || user.role !== "SISWA") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const siswa = await prisma.siswa.findFirst({ where: { nis: user.nis } });
  const j = await prisma.jurnal.findUnique({ where: { id } });
  if (!j || j?.siswaId !== siswa?.id) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  await prisma.jurnal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
