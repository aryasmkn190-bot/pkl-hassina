export type RekomenItem = {
  judul: string;
  ringkasan: string;
  tingkat: "Mudah" | "Sedang" | "Sulit";
  alat: string[];
  bahan: string[];
  langkah: string[];
  durasiMenit: number;
  kategori?: string;
};

function fallbackItems(dudiName: string): RekomenItem[] {
  const base = dudiName || "DU/DI";
  return [
    { judul: `Pembersihan & penataan area kerja di ${base}`, ringkasan: `Merawat kebersihan dan kerapian area kerja sesuai SOP.`, tingkat: "Mudah", alat: ["Sapu","Lap","Tempat sampah"], bahan: ["Cairan pembersih","Tisu"], langkah: ["Siapkan alat pelindung diri","Bersihkan permukaan kerja","Pisahkan sampah sesuai jenis","Rapikan alat pada tempatnya","Dokumentasikan kondisi akhir"], durasiMenit: 30 },
    { judul: `Inventaris alat & bahan di ${base}`, ringkasan: `Mendata stok alat dan bahan untuk kelancaran operasional.`, tingkat: "Mudah", alat: ["Buku/catatan","Pulpen","HP/kamera"], bahan: ["Form inventaris"], langkah: ["Kumpulkan daftar alat","Hitung stok fisik","Cocokkan dengan catatan","Catat selisih & penyebab","Laporkan ke pembimbing"], durasiMenit: 45 },
    { judul: `Observasi alur kerja di ${base}`, ringkasan: `Mengamati urutan proses layanan untuk memahami alur.`, tingkat: "Sedang", alat: ["Buku catatan","Stopwatch HP"], bahan: ["Form observasi"], langkah: ["Tentukan proses yang diamati","Catat tiap tahapan & durasi","Identifikasi bottleneck","Diskusikan temuan dengan pembimbing","Tulis ringkasan observasi"], durasiMenit: 60 },
    { judul: `Simulasi pelayanan pelanggan di ${base}`, ringkasan: `Latihan komunikasi dan pelayanan sesuai standar.`, tingkat: "Sedang", alat: ["Nametag","Seragam"], bahan: ["Skrip pelayanan"], langkah: ["Pelajari SOP pelayanan","Roleplay dengan rekan","Terapkan 3S (senyum, sapa, salam)","Minta feedback pembimbing","Perbaiki kekurangan"], durasiMenit: 45 },
    { judul: `Laporan harian kegiatan di ${base}`, ringkasan: `Menyusun laporan ringkas kegiatan harian secara terstruktur.`, tingkat: "Mudah", alat: ["Laptop/HP","Template laporan"], bahan: [], langkah: ["Kumpulkan data kegiatan","Susun poin-poin penting","Tulis laporan dengan format baku","Lampirkan foto pendukung","Kirim untuk review"], durasiMenit: 30 },
  ];
}

export async function generateRekomendasi(dudi: { name: string; kategori?: string | null; deskripsi?: string | null }): Promise<RekomenItem[]> {
  const key = process.env.META_API_KEY?.trim();
  if (!key) return fallbackItems(dudi.name);
  const kategori = dudi.kategori?.trim() || "umum";
  const deskripsi = dudi.deskripsi?.trim() || dudi.name;
  const prompt = `Kamu asisten PKL SMK. Buat 5 ide kegiatan jurnal harian untuk DU/DI "${dudi.name}" kategori "${kategori}" deskripsi: "${deskripsi}". Siswa SMK PKL level pemula-menengah. Tiap kegiatan harus relevan dengan DU/DI tersebut, bervariasi, durasi 20-90 menit. Output HANYA JSON valid tanpa markdown: {"items":[{"judul":"...","ringkasan":"1 kalimat","tingkat":"Mudah|Sedang|Sulit","alat":["..."],"bahan":["..."],"langkah":["... 5-8 langkah terstruktur singkat jelas"],"durasiMenit":30}]}. Tingkat kesulitannya sebar (ada Mudah, Sedang, 1 Sulit). Bahasa Indonesia.`;
  try {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 22000);
    const r = await fetch("https://api.meta.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "muse-spark-1.2-contributor", messages: [{ role: "user", content: prompt }], max_tokens: 2800 }),
      signal: ac.signal,
    });
    clearTimeout(t);
    const j: any = await r.json().catch(() => null);
    const raw: string = j?.choices?.[0]?.message?.content ?? "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("no json");
    const parsed = JSON.parse(m[0]);
    const items: RekomenItem[] = Array.isArray(parsed.items) ? parsed.items : [];
    const clean = items.slice(0, 5).map((x: any) => ({
      judul: String(x.judul ?? "").slice(0, 120) || "Kegiatan PKL",
      ringkasan: String(x.ringkasan ?? "").slice(0, 240) || "",
      tingkat: (["Mudah","Sedang","Sulit"].includes(x.tingkat) ? x.tingkat : "Sedang") as RekomenItem["tingkat"],
      alat: Array.isArray(x.alat) ? x.alat.map((s:any)=>String(s)).slice(0,6) : [],
      bahan: Array.isArray(x.bahan) ? x.bahan.map((s:any)=>String(s)).slice(0,6) : [],
      langkah: Array.isArray(x.langkah) ? x.langkah.map((s:any)=>String(s)).slice(0,8) : [],
      durasiMenit: Number.isFinite(x.durasiMenit) ? Math.min(180, Math.max(10, Number(x.durasiMenit))) : 45,
      kategori: kategori as string,
    }));
    if (clean.length < 3) throw new Error("too few");
    while (clean.length < 5) (clean as any[]).push(fallbackItems(dudi.name)[clean.length % 5]);
    return clean.slice(0, 5);
  } catch (e) {
    console.error("[rekomendasi AI fallback]", e);
    return fallbackItems(dudi.name);
  }
}
