import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session as unknown as { user?: { uid: string; role: string } })?.user?.uid;
  const role = (session as unknown as { user?: { role: string } })?.user?.role;
  if (!uid || role !== "SISWA") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const siswa = await prisma.siswa.findFirst({ where: { nis: (session as unknown as { user: { nis: string } }).user.nis }, include: { dudi: true } });
  if (!siswa) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });

  const form = await req.formData();
  const type = String(form.get("type") ?? "masuk");
  const lat = form.get("lat") ? Number(form.get("lat")) : null;
  const lng = form.get("lng") ? Number(form.get("lng")) : null;
  const acc = form.get("accuracy") ? Number(form.get("accuracy")) : null;
  const file = form.get("foto") as File | null;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // GPS wajib untuk masuk; jika tidak ada coords → tolak (anti fake absen)
  if (type === "masuk" && (lat == null || lng == null)) {
    return NextResponse.json({ error: "GPS tidak terdeteksi. Aktifkan lokasi & izinkan akses, lalu coba lagi." }, { status: 400 });
  }

  let jarakM: number | null = null;
  if (lat != null && lng != null) jarakM = Math.round(haversine(lat, lng, siswa.dudi.lat, siswa.dudi.lng));

  // Auto-reject jika di luar radius (selfie luar lokasi ditolak)
  if (lat != null && lng != null && jarakM != null && jarakM > siswa.dudi.radiusM) {
    return NextResponse.json({ error: `Di luar radius DUDI (${jarakM}m > ${siswa.dudi.radiusM}m). Dekati lokasi DUDI lalu absen kembali.`, jarakM, radiusM: siswa.dudi.radiusM }, { status: 403 });
  }

  // Foto selfie wajib untuk masuk
  if (type === "masuk" && (!file || file.size === 0)) {
    return NextResponse.json({ error: "Selfie wajib untuk absen masuk. Izinkan kamera." }, { status: 400 });
  }

  let fotoPath: string | null = null;
  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.env.UPLOAD_DIR ?? "/var/lib/pkl-hassina/uploads", "absensi", siswa.nis, today.toISOString().slice(0, 10));
    await mkdir(dir, { recursive: true });
    const name = `${type}-${Date.now()}.jpg`;
    const full = path.join(dir, name);
    await writeFile(full, buf);
    fotoPath = `/uploads/absensi/${siswa.nis}/${today.toISOString().slice(0, 10)}/${name}`;
  }

  const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
  const existing = await prisma.absensi.findUnique({ where: { siswaId_tanggal: { siswaId: siswa.id, tanggal: today } } });

  if (!existing) {
    if (type === "pulang") return NextResponse.json({ error: "Belum absen masuk hari ini." }, { status: 409 });
    const created = await prisma.absensi.create({
      data: { siswaId: siswa.id, tanggal: today, jamMasuk: nowStr, status: "HADIR", lat: lat ?? undefined, lng: lng ?? undefined, jarakM: jarakM ?? undefined, fotoMasuk: fotoPath ?? undefined },
    });
    return NextResponse.json({ ok: true, data: created, jarakM, accuracyM: acc });
  }

  if (type === "pulang") {
    if (existing.jamPulang) return NextResponse.json({ error: "Sudah absen pulang hari ini." }, { status: 409 });
    // Pulang juga validasi radius jika ada GPS
    const updated = await prisma.absensi.update({ where: { id: existing.id }, data: { jamPulang: nowStr, fotoPulang: fotoPath ?? existing.fotoMasuk ?? undefined } });
    return NextResponse.json({ ok: true, data: updated, jarakM, accuracyM: acc });
  }

  return NextResponse.json({ error: "Sudah absen masuk hari ini. Gunakan Absen Pulang." }, { status: 409 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session as unknown as { user?: { uid: string } })?.user?.uid;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const siswa = await prisma.siswa.findFirst({ where: { nis: (session as unknown as { user: { nis: string } }).user.nis } });
  if (!siswa) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = req.nextUrl;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const where: { siswaId: string; tanggal?: { gte?: Date; lte?: Date } } = { siswaId: siswa.id };
  if (from || to) {
    const gte = from ? new Date(from + "T00:00:00.000Z") : undefined;
    const lte = to ? new Date(to + "T00:00:00.000Z") : undefined;
    if (gte && isNaN(+gte)) return NextResponse.json({ error: "from tidak valid (YYYY-MM-DD)" }, { status: 400 });
    if (lte && isNaN(+lte)) return NextResponse.json({ error: "to tidak valid (YYYY-MM-DD)" }, { status: 400 });
    where.tanggal = {};
    if (gte) where.tanggal.gte = gte;
    if (lte) where.tanggal.lte = lte;
  }
  const list = await prisma.absensi.findMany({ where, orderBy: { tanggal: "desc" }, take: 60 });
  return NextResponse.json({ data: list });
}
