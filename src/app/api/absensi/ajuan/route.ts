import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session as unknown as { user?: { uid: string; role: string } })?.user?.uid;
  const role = (session as unknown as { user?: { role: string } })?.user?.role;
  if (!uid || role !== "SISWA") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const siswa = await prisma.siswa.findFirst({ where: { nis: (session as unknown as { user: { nis: string } }).user.nis } });
  if (!siswa) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
  const form = await req.formData();
  const type = String(form.get("type") ?? "").toUpperCase(); // TERLEWAT | IZIN | SAKIT
  if (!["TERLEWAT", "IZIN", "SAKIT"].includes(type)) return NextResponse.json({ error: "type harus TERLEWAT | IZIN | SAKIT" }, { status: 400 });
  const tanggalRaw = String(form.get("tanggal") ?? "").trim();
  const alasan = String(form.get("alasan") ?? "").trim();
  if (!tanggalRaw || !alasan) return NextResponse.json({ error: "tanggal & alasan wajib" }, { status: 400 });
  if (alasan.length < 10) return NextResponse.json({ error: "alasan minimal 10 karakter" }, { status: 400 });
  const tanggal = new Date(tanggalRaw + "T00:00:00.000Z");
  if (isNaN(+tanggal)) return NextResponse.json({ error: "tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 });
  // tidak boleh ajukan untuk hari depan
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tMid = new Date(tanggal); tMid.setHours(0, 0, 0, 0);
  if (tMid > today) return NextResponse.json({ error: "Tidak dapat mengajukan untuk tanggal di masa depan" }, { status: 400 });
  // SAKIT & IZIN wajib foto
  const file = form.get("foto") as File | null;
  const wajibFoto = type === "SAKIT" || type === "IZIN";
  if (wajibFoto && (!file || file.size === 0)) {
    const msg = type === "SAKIT" ? "Foto bukti sakit wajib (obat/surat/kondisi)" : "Foto bukti izin wajib (kegiatan/acara)";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  // cek sudah ada ajuan sama tanggal+type
  const existingAjuan = await prisma.absensiAjuan.findUnique({ where: { siswaId_tanggal_type: { siswaId: siswa.id, tanggal, type: type as "TERLEWAT" | "IZIN" | "SAKIT" } } });
  if (existingAjuan) {
    if (existingAjuan.status === "MENUNGGU") return NextResponse.json({ error: "Ajuan untuk tanggal & jenis ini sudah menunggu persetujuan" }, { status: 409 });
    if (existingAjuan.status === "DISETUJUI") return NextResponse.json({ error: "Tanggal ini sudah disetujui" }, { status: 409 });
    // DITOLAK -> boleh ajukan ulang: hapus yang lama, bikin baru
    await prisma.absensiAjuan.delete({ where: { id: existingAjuan.id } });
  }
  // jika sudah ada Absensi di tanggal itu, tidak perlu ajuan (kecuali TERLEWAT yang alpha? alpha tidak ada row, jadi ajuan tetap bisa)
  const abs = await prisma.absensi.findUnique({ where: { siswaId_tanggal: { siswaId: siswa.id, tanggal } } });
  if (abs && type !== "TERLEWAT") return NextResponse.json({ error: "Tanggal ini sudah ada absensi" }, { status: 409 });
  if (abs && type === "TERLEWAT") return NextResponse.json({ error: "Tanggal ini sudah tercatat absensi" }, { status: 409 });

  let buktiFoto: string | null = null;
  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Foto maksimal 5MB" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.env.UPLOAD_DIR ?? "/var/lib/pkl-hassina/uploads", "absensi-ajuan", siswa.nis, tanggalRaw);
    await mkdir(dir, { recursive: true });
    const name = `${type.toLowerCase()}-${Date.now()}.jpg`;
    await writeFile(path.join(dir, name), buf);
    buktiFoto = `/uploads/absensi-ajuan/${siswa.nis}/${tanggalRaw}/${name}`;
  }

  const ajuan = await prisma.absensiAjuan.create({ data: { siswaId: siswa.id, tanggal, type: type as "TERLEWAT" | "IZIN" | "SAKIT", alasan, buktiFoto: buktiFoto ?? undefined } });
  return NextResponse.json({ ok: true, data: ajuan });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session as unknown as { user?: { uid: string } })?.user?.uid;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const siswa = await prisma.siswa.findFirst({ where: { nis: (session as unknown as { user: { nis: string } }).user.nis } });
  if (!siswa) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const list = await prisma.absensiAjuan.findMany({ where: { siswaId: siswa.id }, orderBy: { tanggal: "desc" }, take: 30 });
  return NextResponse.json({ data: list });
}
