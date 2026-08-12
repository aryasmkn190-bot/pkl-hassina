import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRekomendasi } from "@/lib/rekomendasi";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function todayWIBStr(): string {
  return new Date().toLocaleString("en-CA", { timeZone: "Asia/Jakarta" }).slice(0,10);
}
function todayWIB(): Date {
  return new Date(todayWIBStr()+"T00:00:00");
}

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SISWA") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const nis: string = session.user.nis;
  const siswa = await prisma.siswa.findUnique({ where: { nis } });
  if (!siswa) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const tanggalStr = String(form.get("tanggal") ?? todayWIBStr());
  const idx = Number(form.get("idx") ?? 0);
  const checklistRaw = String(form.get("checklist") ?? "");
  // foto 1-5
  const files = form.getAll("foto").filter((x): x is File => x instanceof File && x.size>0) as File[];
  if (files.length===0) return NextResponse.json({ error: "Upload minimal 1 foto dokumentasi." }, { status: 400 });
  if (files.length>5) return NextResponse.json({ error: "Maks 5 foto." }, { status: 400 });
  for (const f of files) if (f.size>5*1024*1024) return NextResponse.json({ error: "Tiap foto maks 5MB." }, { status: 400 });

  const tanggal = new Date(tanggalStr+"T00:00:00");
  if (isNaN(+tanggal)) return NextResponse.json({ error: "tanggal invalid" }, { status: 400 });

  let rec = await prisma.jurnalRekomendasi.findUnique({ where: { dudiId_tanggal: { dudiId: siswa.dudiId, tanggal } } });
  if (!rec) {
    // generate on-demand if missing (e.g. race after midnight WIB)
    try {
      const dudi = await prisma.dudi.findUnique({ where: { id: siswa.dudiId } });
      if (!dudi) return NextResponse.json({ error: "Rekomendasi tidak ditemukan untuk tanggal tersebut." }, { status: 404 });
      const items = await generateRekomendasi(dudi as any);
      rec = await prisma.jurnalRekomendasi.upsert({
        where: { dudiId_tanggal: { dudiId: siswa.dudiId, tanggal } },
        create: { dudiId: siswa.dudiId, tanggal, items: items as any },
        update: {},
      });
    } catch {
      return NextResponse.json({ error: "Rekomendasi tidak ditemukan untuk tanggal tersebut." }, { status: 404 });
    }
  }
  const items: any[] = Array.isArray((rec as any).items) ? (rec as any).items : [];
  const item = items[idx];
  if (!item) return NextResponse.json({ error: "Item rekomendasi tidak ditemukan." }, { status: 404 });

  let checklist: boolean[] = [];
  try { checklist = JSON.parse(checklistRaw); } catch {}
  if (!Array.isArray(checklist) || checklist.length !== (item.langkah?.length ?? 0) || !checklist.every(Boolean)) {
    return NextResponse.json({ error: "Checklist semua langkah harus tercentang." }, { status: 400 });
  }

  // izinkan >1 jurnal/hari — hapus guard existing

  const dir = path.join(process.env.UPLOAD_DIR ?? "/var/lib/pkl-hassina/uploads", "jurnal", siswa.nis, tanggalStr);
  await mkdir(dir, { recursive: true });
  const fotoPaths: string[] = [];
  for (let i=0;i<files.length;i++) {
    const f=files[i]; const buf=Buffer.from(await f.arrayBuffer());
    const ext=(f.name.split(".").pop()||"jpg").slice(0,4).replace(/[^a-z0-9]/gi,"")||"jpg";
    const name=`rekom-${idx}-${Date.now()}-${i}.${ext}`;
    await writeFile(path.join(dir, name), buf);
    fotoPaths.push(`/uploads/jurnal/${siswa.nis}/${tanggalStr}/${name}`);
  }
  const kegiatanText = `${item.ringkasan}\n\nAlat: ${(item.alat||[]).join(", ") || "-"}\nBahan: ${(item.bahan||[]).join(", ") || "-"}\n\nLangkah:\n${(item.langkah||[]).map((s:string,i:number)=>`${i+1}. ${s}`).join("\n")}\n\nDurasi: ${item.durasiMenit||"-"} menit · Tingkat: ${item.tingkat||"-"}\n(Rekomendasi AI — ${item.judul})`;

  const tanggalDate = new Date(tanggalStr+"T12:00:00+07:00");
  const jurnal = await prisma.jurnal.create({
    data: { siswaId: siswa.id, tanggal: tanggalDate, judul: item.judul, kegiatan: kegiatanText, foto: fotoPaths, status: "DISETUJUI" },
  });
  return NextResponse.json({ ok: true, data: jurnal });
}
