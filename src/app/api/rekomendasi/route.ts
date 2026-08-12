import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRekomendasi } from "@/lib/rekomendasi";

function todayWIBStr(): string {
  return new Date().toLocaleString("en-CA", { timeZone: "Asia/Jakarta" }).slice(0,10);
}
function todayWIB(): Date {
  return new Date(todayWIBStr()+"T00:00:00");
}

export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SISWA") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const nis: string = session.user.nis;
  const siswa = await prisma.siswa.findUnique({ where: { nis }, include: { dudi: true } });
  if (!siswa) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
  const tanggalStr2 = req.nextUrl.searchParams.get("tanggal") ?? todayWIBStr();
  const tanggal = new Date(tanggalStr2+"T00:00:00");
  if (isNaN(+tanggal)) return NextResponse.json({ error: "tanggal invalid YYYY-MM-DD" }, { status: 400 });
  let row = await prisma.jurnalRekomendasi.findUnique({ where: { dudiId_tanggal: { dudiId: siswa.dudiId, tanggal } } });
  if (!row) {
    const items = await generateRekomendasi(siswa.dudi as any);
    try {
      row = await prisma.jurnalRekomendasi.create({ data: { dudiId: siswa.dudiId, tanggal, items: items as any } });
    } catch {
      row = await prisma.jurnalRekomendasi.findUnique({ where: { dudiId_tanggal: { dudiId: siswa.dudiId, tanggal } } });
    }
  }
  return NextResponse.json({ ok: true, dudi: { id: siswa.dudi.id, name: siswa.dudi.name }, tanggal: tanggalStr2, items: (row as any).items });
}
