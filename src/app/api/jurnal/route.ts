import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function hariIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = (session as unknown as { user?: { uid: string; nis?: string; role: string } })?.user;
  if (!user?.uid || user.role !== "SISWA") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const siswa = await prisma.siswa.findFirst({ where: { nis: user.nis } });
  if (!siswa) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });

  const isForm = (req.headers.get("content-type") ?? "").includes("multipart/form-data");
  let judul = "", kegiatan = "", kendala: string | null = null, jamMulai: string | null = null, jamSelesai: string | null = null;
  let fotoPaths: string[] = [];
  let tanggalForCreate: Date = new Date();

  if (isForm) {
    const form = await req.formData();
    judul = String(form.get("judul") ?? "").trim();
    kegiatan = String(form.get("kegiatan") ?? "").trim();
    kendala = form.get("kendala") ? String(form.get("kendala")).trim() || null : null;
    jamMulai = form.get("jamMulai") ? String(form.get("jamMulai")) : null;
    jamSelesai = form.get("jamSelesai") ? String(form.get("jamSelesai")) : null;
    const tanggalRaw = form.get("tanggal") ? String(form.get("tanggal")).trim() : null;
    tanggalForCreate = tanggalRaw && /^\d{4}-\d{2}-\d{2}$/.test(tanggalRaw) ? new Date(tanggalRaw + "T12:00:00+07:00") : new Date();
    const files = form.getAll("foto") as File[];
    const uploadDir = process.env.UPLOAD_DIR ?? "/var/lib/pkl-hassina/uploads";
    const day = tanggalRaw && /^\d{4}-\d{2}-\d{2}$/.test(tanggalRaw) ? tanggalRaw : hariIniJakarta();
    for (const f of files.slice(0, 5)) {
      if (!f || !(f as File).arrayBuffer || (f as File).size === 0) continue;
      if ((f as File).size > 5 * 1024 * 1024) continue;
      const buf = Buffer.from(await (f as File).arrayBuffer());
      const dir = path.join(uploadDir, "jurnal", siswa.nis, day);
      await mkdir(dir, { recursive: true });
      const name = `j-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
      const full = path.join(dir, name);
      await writeFile(full, buf);
      fotoPaths.push(`/uploads/jurnal/${siswa.nis}/${day}/${name}`);
    }
  } else {
    const body = (await req.json().catch(() => null)) as { judul?: string; kegiatan?: string; kendala?: string; jamMulai?: string; jamSelesai?: string; tanggal?: string } | null;
    judul = String(body?.judul ?? "").trim();
    kegiatan = String(body?.kegiatan ?? "").trim();
    kendala = body?.kendala ? String(body.kendala).trim() || null : null;
    jamMulai = body?.jamMulai ? String(body.jamMulai) : null;
    jamSelesai = body?.jamSelesai ? String(body.jamSelesai) : null;
    const tanggalRaw2 = body?.tanggal ? String(body.tanggal).trim() : null;
    if (tanggalRaw2 && /^\d{4}-\d{2}-\d{2}$/.test(tanggalRaw2)) tanggalForCreate = new Date(tanggalRaw2 + "T12:00:00+07:00");
  }

  if (!judul || !kegiatan) return NextResponse.json({ error: "Judul & uraian kegiatan wajib diisi." }, { status: 400 });

  const j = await prisma.jurnal.create({
    data: { siswaId: siswa.id, tanggal: tanggalForCreate, judul, kegiatan, kendala, jamMulai, jamSelesai, status: "DISETUJUI" as never, foto: fotoPaths },
  });
  return NextResponse.json({ ok: true, data: j });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = (session as unknown as { user?: { nis?: string; uid: string; role: string } })?.user;
  if (!user?.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SISWA" && !user.nis) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const siswa = await prisma.siswa.findFirst({ where: { nis: user.nis } });
  if (!siswa) return NextResponse.json({ data: [] });
  const list = await prisma.jurnal.findMany({ where: { siswaId: siswa.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ data: list.map((j) => ({ ...j, tanggalIso: j.tanggal instanceof Date ? j.tanggal.toISOString().slice(0, 10) : String(j.tanggal).slice(0,10) })) });
}
