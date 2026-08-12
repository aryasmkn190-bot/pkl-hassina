import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(v: string) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) return '"' + v.replaceAll('"', '""') + '"';
  return v;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session as unknown as { user?: { role: string } })?.user?.role;
  if (role !== "PEMBIMBING" && role !== "ADMIN" && role !== "SUPERADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const fmt = url.searchParams.get("format") ?? "json";
  const dudiId = url.searchParams.get("dudiId");

  const siswaWhere: Record<string, unknown> = {};
  if (dudiId) siswaWhere.dudiId = dudiId;
  // PEMBIMBING scope: hanya siswa bimbingan-nya
  const maybeUid = (session as unknown as { user?: { uid?: string; role?: string } })?.user;
  if (maybeUid?.role === "PEMBIMBING" && maybeUid.uid) (siswaWhere as Record<string, unknown>).pembimbingId = maybeUid.uid;
  const siswa = await prisma.siswa.findMany({
    where: siswaWhere as never,
    include: { dudi: true, _count: { select: { jurnal: true } } },
  });
  // hitung rekap per siswa
  const rekap = await Promise.all(
    siswa.map(async (s) => {
      const hadir = await prisma.absensi.count({ where: { siswaId: s.id, status: "HADIR" } });
      const izin = await prisma.absensi.count({ where: { siswaId: s.id, status: { in: ["IZIN", "SAKIT"] as never } } });
      const antri = await prisma.jurnal.count({ where: { siswaId: s.id, status: "TERKIRIM" } });
      return { id: s.id, nis: s.nis, nama: s.name, kelas: s.kelas, dudi: s.dudi.name, hadir, izin, antri };
    }),
  );

  if (fmt === "csv" || fmt === "xlsx") {
    const header = "NIS,Nama,Kelas,DUDI,Hadir,Izin,Antri\n";
    const rows = rekap.map((r) => [r.nis, r.nama, r.kelas, r.dudi, String(r.hadir), String(r.izin), String(r.antri)].map(csvEscape).join(",")).join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"rekap-pkl-${new Date().toISOString().slice(0, 10)}.csv\"`,
      },
    });
  }
  return NextResponse.json({ data: rekap });
}
