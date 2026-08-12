"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function cn(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" "); }

type ATab = "siswa" | "dudi" | "pembimbing" | "rekap";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<ATab>("siswa");
  const [toast, setToast] = useState<string | null>(null);
  const [rekap, setRekap] = useState<Array<{ nis: string; nama: string; kelas: string; dudi: string; hadir: number; izin: number; antri: number }>>([]);
  const [siswaList, setSiswaList] = useState<Array<{ nis: string; name: string; kelas: string; jurusan: string; dudi: { name: string }; dudiId: string }>>([]);
  const [pembList, setPembList] = useState<Array<{ id: string; name: string; email: string; _count: { siswa: number } }>>([]);
  const [q, setQ] = useState("");
  const [csvText, setCsvText] = useState("");
  const [dudiDraft, setDudiDraft] = useState({ nama: "", alamat: "", kategori: "", deskripsi: "", kuota: "" });
  const [pembDraft, setPembDraft] = useState({ name: "", email: "", password: "" });
  const [editSiswa, setEditSiswa] = useState<null | { nis: string; name: string; kelas: string; jurusan: string; dudiId: string }>(null);
  const [editDudi, setEditDudi] = useState<null | { id: string; name: string; alamat: string; kategori: string; deskripsi: string; pimpinan: string; noTelp: string; lat: number; lng: number; radiusM: number; kuota: number }>(null);
  const [dudiLive, setDudiLive] = useState<Array<{ id: string; name: string; alamat: string; kategori: string | null; deskripsi: string | null; pimpinan: string | null; noTelp: string | null; lat: number; lng: number; _count: { siswa: number }; kuota: number; radiusM: number }>>([]);
  const pop = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3200); };

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => {
    const role = (session as unknown as { user?: { role: string } })?.user?.role;
    if (role && role !== "SUPERADMIN" && role !== "ADMIN") {
      if (role === "PEMBIMBING") router.replace("/pembimbing");
      else if (role === "SISWA") router.replace("/siswa");
    }
  }, [session, router]);

  async function loadAll() {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch("/api/admin/siswa"), fetch("/api/admin/dudi"),
        fetch("/api/admin/pembimbing"), fetch("/api/pembimbing/rekap"),
      ]);
      const j1 = await r1.json().catch(() => ({})); const j2 = await r2.json().catch(() => ({}));
      const j3 = await r3.json().catch(() => ({})); const j4 = await r4.json().catch(() => ({}));
      if (r1.ok && Array.isArray(j1.data)) setSiswaList(j1.data);
      if (r2.ok && Array.isArray(j2.data)) setDudiLive(j2.data);
      if (r3.ok && Array.isArray(j3.data)) setPembList(j3.data);
      if (r4.ok && Array.isArray(j4.data)) setRekap(j4.data);
    } catch {}
  }
  useEffect(() => { loadAll(); }, []);
  useEffect(() => { (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons(); }, [tab]);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/lucide@latest";
    s.onload = () => (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons();
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  const filteredSiswa = siswaList.filter((s) => !q || `${s.nis} ${s.name} ${s.kelas}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[var(--palette-background)] pb-28 relative">
      <header className="sticky top-0 z-30" style={{ background: "var(--palette-surface)", borderBottom: "1px solid var(--palette-border)" }}>
        <div className="px-6 pt-6 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-hassina.jpg" alt="SMK HASSINA" className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid var(--palette-border)" }} />
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-none" style={{ color: "var(--palette-foreground-ink)" }}>SMK HASSINA</p>
              <p className="text-[11px] leading-none mt-0.5" style={{ color: "var(--palette-foreground-muted)" }}>Admin · {tab === "siswa" ? "Siswa" : tab === "dudi" ? "DUDI" : tab === "pembimbing" ? "Pembimbing" : "Rekap"}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background: "var(--palette-surface-muted)", color: "var(--palette-foreground-muted)" }}><i data-lucide="log-out" className="w-4 h-4" /></button>
        </div>
        {(tab === "siswa" || tab === "dudi") && (
          <div className="px-6 pb-3"><div className="rounded-full py-2.5 px-4 flex items-center" style={{ background: "var(--palette-surface-muted)", color: "var(--palette-foreground-muted)" }}><i data-lucide="search" className="w-4 h-4 mr-2" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "siswa" ? "Cari NIS / nama / kelas..." : "Cari DUDI..."} className="bg-transparent outline-none w-full text-sm flex-1" style={{ color: "var(--palette-foreground)" }} /></div></div>
        )}
      </header>

      {/* tab strip under header */}
      <div className="px-6 pt-3 flex gap-2 overflow-x-auto hide-scrollbar">
        {([
          ["siswa", `Siswa (${siswaList.length})`],
          ["dudi", `DUDI (${dudiLive.length})`],
          ["pembimbing", `Pembimbing (${pembList.length})`],
          ["rekap", "Rekap"],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={cn("shrink-0 rounded-full px-4 py-2 text-[12px] font-bold", tab === id ? "text-white shadow" : "")} style={tab === id ? { background: "var(--palette-primary)" } : { background: "var(--palette-surface)", color: "var(--palette-foreground-muted)", border: "1px solid var(--palette-border)" }}>
            {label}
          </button>
        ))}
      </div>

      <main className="px-6 pt-4 space-y-4">
        {tab === "siswa" && (
          <>
            <div className="rounded-2xl p-4" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
              <p className="text-[13px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>Import siswa</p>
              <p className="text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>Excel .xlsx atau CSV — header: nis,nama,kelas,jurusan,dudiId. Password awal 123456.</p>
              <label className="mt-3 flex items-center justify-center gap-2 rounded-full py-3 text-[13px] font-bold cursor-pointer" style={{ background: "var(--palette-primary)", color: "white" }}>
                <i data-lucide="upload" className="w-4 h-4" /> Upload .xlsx
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const XLSX = await import("xlsx");
                  const buf = await f.arrayBuffer();
                  const wb = XLSX.read(buf, { type: "array" });
                  const ws = wb.Sheets[wb.SheetNames[0]];
                  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
                  if (!rows.length) { pop("Excel kosong."); return; }
                  const norm = (k: string) => k.trim().toLowerCase();
                  const headerMap: Record<string, string> = {};
                  Object.keys(rows[0] ?? {}).forEach((k) => { headerMap[norm(k)] = k; });
                  const get = (r: Record<string, string>, key: string) => String(r[headerMap[norm(key)] ?? key] ?? "").trim();
                  const lines = rows.map((r) => {
                    const nis = get(r, "nis"); const nama = get(r, "nama"); const kelas = get(r, "kelas"); const jurusan = get(r, "jurusan"); let dudiId = get(r, "dudiId") || get(r, "dudi") || "";
                    if (!dudiId) dudiId = dudiLive[0]?.id ?? "";
                    return [nis, nama, kelas, jurusan, dudiId].join(",");
                  }).join("\n");
                  setCsvText(lines);
                  pop(`Excel ${f.name}: ${rows.length} baris — cek & Import.`);
                  (e.target as HTMLInputElement).value = "";
                }} />
              </label>
              <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={"nis,nama,kelas,jurusan,dudiId\n232410011,Budi,XII TKJ 1,TKJ,<dudiId>"} rows={4} className="mt-3 w-full rounded-2xl px-3.5 py-3 text-[11px] font-mono outline-none" style={{ background: "var(--palette-surface-muted)", border: "1px solid var(--palette-border)", color: "var(--palette-foreground)" }} />
              <button onClick={async () => {
                if (!csvText.trim()) return pop("Paste CSV / upload dulu.");
                const firstDudi = dudiLive[0]?.id;
                const r = await fetch("/api/admin/siswa/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: csvText, dudiId: firstDudi }) });
                const j = await r.json().catch(() => ({}));
                if (!r.ok) return pop(j.error ?? "Gagal import.");
                pop(`Import: ${j.imported} ok, ${j.skipped} dilewati` + (j.errors?.length ? ` — ${j.errors[0]}` : ""));
                setCsvText(""); loadAll();
              }} className="mt-2 w-full rounded-full py-2.5 text-[13px] font-bold" style={{ background: "var(--palette-surface)", color: "var(--palette-foreground)", border: "1px solid var(--palette-border)" }}>Import CSV</button>
              <p className="mt-2 text-[10px] text-center" style={{ color: "var(--palette-foreground-muted)" }}>DUDI: {dudiLive.map((d) => `${d.name} (${d.id.slice(-6)})`).join(" · ") || "—"}</p>
            </div>

            <div className="space-y-2">
              {filteredSiswa.length === 0 ? (
                <div className="rounded-2xl p-8 text-center text-[13px]" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>Belum ada siswa — import dulu.</div>
              ) : filteredSiswa.map((s) => (
                <div key={s.nis} className="rounded-2xl p-4" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold truncate" style={{ color: "var(--palette-foreground-ink)" }}>{s.name}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--palette-foreground-muted)" }}>{s.nis} · {s.kelas} · {s.jurusan}</p>
                      <p className="text-[11px] flex items-center gap-1 truncate" style={{ color: "var(--palette-foreground-muted)" }}><i data-lucide="building-2" className="w-3 h-3" />{s.dudi.name}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full h-fit" style={{ background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" }}>{s.dudiId.slice(-6)}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <button onClick={() => setEditSiswa({ nis: s.nis, name: s.name, kelas: s.kelas, jurusan: s.jurusan, dudiId: s.dudiId })} className="rounded-full py-2 text-[11px] font-bold" style={{ background: "var(--palette-surface)", color: "var(--palette-foreground)", border: "1px solid var(--palette-border)" }}>Edit</button>
                    <button onClick={async () => { const r = await fetch(`/api/admin/siswa/${s.nis}/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "123456" }) }); const j = await r.json().catch(() => ({})); pop(r.ok ? `${s.nis} → 123456 ✓` : (j.error ?? "Gagal")); }} className="rounded-full py-2 text-[11px] font-bold" style={{ background: "var(--palette-warning-subtle)", color: "var(--palette-warning)" }}>Reset</button>
                    <button onClick={async () => { if (!confirm(`Hapus ${s.name} (${s.nis})?`)) return; const r = await fetch(`/api/admin/siswa/${s.nis}`, { method: "DELETE" }); const j = await r.json().catch(() => ({})); pop(r.ok ? "Siswa dihapus ✓" : (j.error ?? "Gagal")); if (r.ok) loadAll(); }} className="rounded-full py-2 text-[11px] font-bold" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            {editSiswa && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditSiswa(null)}>
                <div className="w-full max-w-[420px] rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflow: "auto" }}>
                  <p className="text-[14px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>Edit {editSiswa.nis}</p>
                  <div className="mt-3 grid gap-2">
                    <input value={editSiswa.name} onChange={(e) => setEditSiswa({ ...editSiswa, name: e.target.value })} placeholder="Nama" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={editSiswa.kelas} onChange={(e) => setEditSiswa({ ...editSiswa, kelas: e.target.value })} placeholder="Kelas" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                      <input value={editSiswa.jurusan} onChange={(e) => setEditSiswa({ ...editSiswa, jurusan: e.target.value })} placeholder="Jurusan" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                    </div>
                    <select value={editSiswa.dudiId} onChange={(e) => setEditSiswa({ ...editSiswa, dudiId: e.target.value })} className="rounded-2xl px-4 py-3 text-sm bg-white outline-none" style={{ border: "1px solid var(--palette-border)" }}>
                      {dudiLive.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setEditSiswa(null)} className="flex-1 rounded-full py-2.5 text-sm font-bold" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>Batal</button>
                    <button onClick={async () => {
                      const r = await fetch(`/api/admin/siswa/${editSiswa.nis}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editSiswa.name, kelas: editSiswa.kelas, jurusan: editSiswa.jurusan, dudiId: editSiswa.dudiId }) });
                      const j = await r.json().catch(() => ({})); if (!r.ok) return pop(j.error ?? "Gagal");
                      pop("Siswa diperbarui ✓"); setEditSiswa(null); loadAll();
                    }} className="flex-1 rounded-full py-2.5 text-sm font-bold text-white" style={{ background: "var(--palette-primary)" }}>Simpan</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "dudi" && (
          <>
            <div className="space-y-2">
              {dudiLive.map((d) => (
                <div key={d.id} className="rounded-2xl p-4" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                  <p className="text-[13px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>{d.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>{d.alamat} {d.pimpinan ? `· Pimp: ${d.pimpinan}` : ""}</p>
                  <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--palette-foreground-muted)" }}><i data-lucide="map-pin" className="w-3 h-3" />{d.lat.toFixed(5)}, {d.lng.toFixed(5)} · radius {d.radiusM}m {d.noTelp ? `· ${d.noTelp}` : ""}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--palette-surface-muted)" }}><div className="h-full" style={{ width: `${Math.round(((d._count?.siswa ?? 0) / (d.kuota || 10)) * 100)}%`, background: "var(--palette-primary)" }} /></div>
                    <span className="text-[11px] font-bold" style={{ color: "var(--palette-foreground-muted)" }}>{d._count?.siswa ?? 0}/{d.kuota}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => setEditDudi({ id: d.id, name: d.name, alamat: d.alamat, kategori: d.kategori ?? "", deskripsi: d.deskripsi ?? "", pimpinan: d.pimpinan ?? "", noTelp: d.noTelp ?? "", lat: d.lat, lng: d.lng, radiusM: d.radiusM ?? 150, kuota: d.kuota ?? 10 })} className="rounded-full py-2 text-[11px] font-bold" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>Edit</button>
                    <button onClick={() => setEditDudi({ id: d.id, name: d.name, alamat: d.alamat, kategori: d.kategori ?? "", deskripsi: d.deskripsi ?? "", pimpinan: d.pimpinan ?? "", noTelp: d.noTelp ?? "", lat: d.lat, lng: d.lng, radiusM: d.radiusM ?? 150, kuota: d.kuota ?? 10 })} className="rounded-full py-2 text-[11px] font-bold" style={{ background: "var(--palette-primary-subtle)", color: "var(--palette-primary)", border: "1px solid var(--palette-primary-muted)" as unknown as string }}>📍 Map</button>
                    <button onClick={async () => {
                      const n = d._count?.siswa ?? 0;
                      if (n > 0) { pop(`Tidak bisa hapus — masih ${n} siswa.`); return; }
                      if (!confirm(`Hapus DUDI "${d.name}"?`)) return;
                      const r = await fetch(`/api/admin/dudi/${d.id}`, { method: "DELETE" });
                      const j = await r.json().catch(() => ({})); pop(r.ok ? "DUDI dihapus ✓" : (j.error ?? "Gagal")); if (r.ok) loadAll();
                    }} className="rounded-full py-2 text-[11px] font-bold" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-4" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
              <p className="text-[13px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>Tambah DUDI</p>
              <div className="mt-3 grid gap-2">
                <input value={dudiDraft.nama} onChange={(e) => setDudiDraft({ ...dudiDraft, nama: e.target.value })} placeholder="Nama DUDI" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                <input value={dudiDraft.alamat} onChange={(e) => setDudiDraft({ ...dudiDraft, alamat: e.target.value })} placeholder="Alamat lengkap" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                <input value={dudiDraft.kategori} onChange={(e) => setDudiDraft({ ...dudiDraft, kategori: e.target.value })} placeholder="Kategori (mis. Otomotif / TKJ / Kuliner)" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                <textarea value={dudiDraft.deskripsi} onChange={(e) => setDudiDraft({ ...dudiDraft, deskripsi: e.target.value })} placeholder="Deskripsi singkat DU/DI — dipakai AI untuk rekomendasi kegiatan" rows={3} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                <input value={dudiDraft.kuota} onChange={(e) => setDudiDraft({ ...dudiDraft, kuota: e.target.value })} placeholder="Kuota" inputMode="numeric" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
              </div>
              <button onClick={async () => {
                if (!dudiDraft.nama || !dudiDraft.alamat) return pop("Isi nama & alamat.");
                const r = await fetch("/api/admin/dudi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: dudiDraft.nama, alamat: dudiDraft.alamat, kategori: dudiDraft.kategori || undefined, deskripsi: dudiDraft.deskripsi || undefined, kuota: Number(dudiDraft.kuota) || 10 }) });
                const j = await r.json().catch(() => ({})); if (!r.ok) return pop(j.error ?? "Gagal");
                pop(`DUDI "${j.data.name}" ditambahkan ✓`); setDudiDraft({ nama: "", alamat: "", kategori: "", deskripsi: "", kuota: "" }); loadAll();
              }} className="mt-3 w-full rounded-full py-3 text-sm font-bold text-white" style={{ background: "var(--palette-primary)" }}>Simpan DUDI</button>
            </div>
            {editDudi && (
              <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 p-0 sm:p-4" onClick={() => setEditDudi(null)}>
                <div className="w-full max-w-[520px] rounded-t-3xl sm:rounded-2xl bg-white p-5 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center"><p className="text-[14px] font-bold">Edit DUDI · atur titik & radius</p><button onClick={() => setEditDudi(null)} className="w-8 h-8 rounded-full grid place-items-center bg-slate-100"><i data-lucide="x" className="w-4 h-4" /></button></div>
                  <div className="mt-3 grid gap-2">
                    <input value={editDudi.name} onChange={(e) => setEditDudi({ ...editDudi, name: e.target.value })} placeholder="Nama DUDI" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                    <input value={editDudi.alamat} onChange={(e) => setEditDudi({ ...editDudi, alamat: e.target.value })} placeholder="Alamat" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                    <input value={editDudi.kategori} onChange={(e) => setEditDudi({ ...editDudi, kategori: e.target.value })} placeholder="Kategori (Otomotif / TKJ / Kuliner ...)" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                    <textarea value={editDudi.deskripsi} onChange={(e) => setEditDudi({ ...editDudi, deskripsi: e.target.value })} placeholder="Deskripsi singkat DU/DI — dipakai AI rekomendasi" rows={3} className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={editDudi.pimpinan} onChange={(e) => setEditDudi({ ...editDudi, pimpinan: e.target.value })} placeholder="Pimpinan (sertifikat)" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                      <input value={editDudi.noTelp} onChange={(e) => setEditDudi({ ...editDudi, noTelp: e.target.value })} placeholder="No Telp DUDI" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={String(editDudi.kuota)} onChange={(e) => setEditDudi({ ...editDudi, kuota: Number(e.target.value) || 0 })} placeholder="Kuota" inputMode="numeric" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                      <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ border: "1px solid var(--palette-border)" }}>
                        <span className="text-[11px] font-bold" style={{ color: "var(--palette-foreground-muted)" }}>Radius</span>
                        <span className="text-sm font-bold" style={{ color: "var(--palette-primary)" }}>{editDudi.radiusM}m</span>
                      </div>
                    </div>
                    <input type="range" min={50} max={500} step={10} value={editDudi.radiusM} onChange={(e) => setEditDudi({ ...editDudi, radiusM: Number(e.target.value) })} className="w-full accent-[var(--palette-primary)]" />
                    <div className="flex gap-2">
                      <button onClick={() => { if (!navigator.geolocation) return pop("GPS tidak tersedia"); navigator.geolocation.getCurrentPosition((p) => setEditDudi({ ...editDudi, lat: p.coords.latitude, lng: p.coords.longitude }), () => pop("Gagal ambil lokasi"), { enableHighAccuracy: true }); }} className="flex-1 rounded-full py-2 text-[11px] font-bold" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>📍 Lokasi saya</button>
                      <span className="flex-1 text-[11px] flex items-center justify-center rounded-full px-2" style={{ background: "var(--palette-surface-muted)", color: "var(--palette-foreground-muted)" }}>{editDudi.lat.toFixed(5)}, {editDudi.lng.toFixed(5)}</span>
                    </div>
                    {/* OpenMap: Leaflet OSM — tap peta untuk pindah pin */}
                    <div id="dudi-map" className="w-full h-[220px] rounded-2xl overflow-hidden" style={{ border: "1px solid var(--palette-border)" }} />
                    <p className="text-[11px] text-center" style={{ color: "var(--palette-foreground-muted)" }}>Tap peta / geser pin untuk atur koordinat · radius {editDudi.radiusM}m</p>
                  </div>
                  {/* Leaflet loader — ponytail: pakai CDN OSM tanpa npm */}
                  <LeafletDudiMap lat={editDudi.lat} lng={editDudi.lng} radiusM={editDudi.radiusM} onMove={(lat, lng) => setEditDudi((prev) => prev ? { ...prev, lat, lng } : prev)} />
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setEditDudi(null)} className="flex-1 rounded-full py-2.5 text-sm font-bold" style={{ border: "1px solid var(--palette-border)" }}>Batal</button>
                    <button onClick={async () => {
                      const r = await fetch(`/api/admin/dudi/${editDudi.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editDudi.name, alamat: editDudi.alamat, kategori: editDudi.kategori || null, deskripsi: editDudi.deskripsi || null, pimpinan: editDudi.pimpinan || null, noTelp: editDudi.noTelp || null, lat: editDudi.lat, lng: editDudi.lng, radiusM: editDudi.radiusM, kuota: editDudi.kuota }) });
                      const j = await r.json().catch(() => ({})); if (!r.ok) return pop(j.error ?? "Gagal");
                      pop("DUDI diperbarui ✓"); setEditDudi(null); loadAll();
                    }} className="flex-1 rounded-full py-2.5 text-sm font-bold text-white" style={{ background: "var(--palette-primary)" }}>Simpan</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "pembimbing" && (
          <>
            <div className="rounded-2xl p-4" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
              <p className="text-[13px] font-bold">Tambah pembimbing</p>
              <p className="text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>Buat akun pembimbing — login pakai email.</p>
              <div className="mt-3 grid gap-2">
                <input value={pembDraft.name} onChange={(e) => setPembDraft({ ...pembDraft, name: e.target.value })} placeholder="Nama pembimbing" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                <input value={pembDraft.email} onChange={(e) => setPembDraft({ ...pembDraft, email: e.target.value })} placeholder="email@smkhassina.sch.id" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
                <input value={pembDraft.password} onChange={(e) => setPembDraft({ ...pembDraft, password: e.target.value })} placeholder="Password (default: pembimbing123)" className="rounded-2xl px-4 py-3 text-sm outline-none" style={{ border: "1px solid var(--palette-border)" }} />
              </div>
              <button onClick={async () => {
                if (!pembDraft.name || !pembDraft.email) return pop("Isi nama & email.");
                const r = await fetch("/api/admin/pembimbing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pembDraft) });
                const j = await r.json().catch(() => ({})); if (!r.ok) return pop(j.error ?? "Gagal");
                pop(`Pembimbing ${j.data.name} dibuat ✓`); setPembDraft({ name: "", email: "", password: "" }); loadAll();
              }} className="mt-3 w-full rounded-full py-3 text-sm font-bold text-white" style={{ background: "var(--palette-primary)" }}>Buat pembimbing</button>
            </div>
            <div className="space-y-2">
              {pembList.map((p) => (
                <div key={p.id} className="rounded-2xl p-4 flex justify-between items-center" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--palette-foreground-ink)" }}>{p.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--palette-foreground-muted)" }}>{p.email} · {p._count.siswa} siswa bimbingan</p>
                  </div>
                  <button onClick={async () => {
                    if (!confirm(`Hapus pembimbing ${p.name}? Siswa bimbingan akan dilepas.`)) return;
                    const r = await fetch(`/api/admin/pembimbing/${p.id}`, { method: "DELETE" });
                    const j = await r.json().catch(() => ({})); pop(r.ok ? "Pembimbing dihapus ✓" : (j.error ?? "Gagal")); if (r.ok) loadAll();
                  }} className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ml-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>Hapus</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "rekap" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl p-3 text-center" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}><p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--palette-foreground-muted)" }}>Hadir</p><p className="text-[20px] font-extrabold" style={{ color: "var(--palette-success)" }}>{rekap.reduce((a, b) => a + b.hadir, 0)}</p></div>
              <div className="rounded-2xl p-3 text-center" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}><p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--palette-foreground-muted)" }}>Antri</p><p className="text-[20px] font-extrabold" style={{ color: "var(--palette-warning)" }}>{rekap.reduce((a, b) => a + b.antri, 0)}</p></div>
              <div className="rounded-2xl p-3 text-center" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}><p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--palette-foreground-muted)" }}>Siswa</p><p className="text-[20px] font-extrabold" style={{ color: "var(--palette-primary)" }}>{rekap.length}</p></div>
            </div>
            <div className="space-y-2">
              {rekap.map((s) => (
                <div key={s.nis} className="rounded-2xl px-4 py-3 flex justify-between items-center" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>
                  <div className="min-w-0"><p className="text-[13px] font-bold truncate">{s.nama}</p><p className="text-[11px] truncate" style={{ color: "var(--palette-foreground-muted)" }}>{s.nis} · {s.kelas} · {s.dudi}</p></div>
                  <span className="shrink-0 w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold" style={{ background: "var(--palette-success-subtle)", color: "var(--palette-success)" }}>{s.hadir}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <a href="/api/pembimbing/rekap?format=csv" className="flex-1 rounded-full py-3 text-center text-[13px] font-bold" style={{ background: "var(--palette-surface)", color: "var(--palette-primary)", border: "1px solid var(--palette-border)" }}>⬇ CSV</a>
              <button onClick={() => {
                const rows = rekap.map((s) => `<tr><td style="border:1px solid #e2e8f0;padding:6px">${s.nama}</td><td style="border:1px solid #e2e8f0;padding:6px">${s.nis}</td><td style="border:1px solid #e2e8f0;padding:6px">${s.kelas}</td><td style="border:1px solid #e2e8f0;padding:6px">${s.dudi}</td><td style="border:1px solid #e2e8f0;padding:6px;text-align:center">${s.hadir}</td><td style="border:1px solid #e2e8f0;padding:6px;text-align:center">${s.antri}</td></tr>`).join("");
                const html = `<!doctype html><html><head><meta charset="utf-8"><title>Rekap PKL — ${new Date().toLocaleDateString("id-ID")}</title></head><body style="font-family:system-ui;padding:24px"><h2>Rekap PKL — SMK Hassina</h2><p style="color:#64748b;font-size:12px">${new Date().toLocaleString("id-ID")} · ${rekap.length} siswa</p><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#f8fafc"><th style="border:1px solid #e2e8f0;padding:6px">Nama</th><th style="border:1px solid #e2e8f0;padding:6px">NIS</th><th style="border:1px solid #e2e8f0;padding:6px">Kelas</th><th style="border:1px solid #e2e8f0;padding:6px">DUDI</th><th style="border:1px solid #e2e8f0;padding:6px">Hadir</th><th style="border:1px solid #e2e8f0;padding:6px">Antri</th></tr></thead><tbody>${rows}</tbody></table><script>window.print()</script></body></html>`;
                const w = window.open("", "_blank"); if (!w) return; w.document.write(html); w.document.close();
              }} className="flex-1 rounded-full py-3 text-center text-[13px] font-bold text-white" style={{ background: "var(--palette-primary)" }}>🖨 Cetak / PDF</button>
            </div>
          </div>
        )}
      </main>

      {/* bottom nav — Pulse glass-pill 4 tabs like /siswa */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[86%] max-w-[360px] z-30">
        <div className="rounded-full py-3 px-6 flex justify-between items-center shadow-lg" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
          <button onClick={() => setTab("siswa")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "siswa" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="users" className="w-5 h-5" /></button>
          <button onClick={() => setTab("dudi")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "dudi" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="building-2" className="w-5 h-5" /></button>
          <button onClick={() => setTab("pembimbing")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "pembimbing" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="graduation-cap" className="w-5 h-5" /></button>
          <button onClick={() => setTab("rekap")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "rekap" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="bar-chart-3" className="w-5 h-5" /></button>
        </div>
      </div>

      {toast && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-[86%] max-w-[360px]"><div className="rounded-2xl px-4 py-3 text-[13px] font-medium text-white shadow-xl text-center" style={{ background: "var(--palette-foreground-ink)" }}>{toast}</div></div>}
    </div>
  );
}

function LeafletDudiMap({ lat, lng, radiusM, onMove }: { lat: number; lng: number; radiusM: number; onMove: (lat: number, lng: number) => void }) {
  useEffect(() => {
    let map: any = null; let marker: any = null; let circle: any = null; let L: any = null;
    async function init() {
      if (typeof document === "undefined") return;
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      }
      if (!(window as unknown as { L?: unknown }).L) {
        await new Promise<void>((res, rej) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = () => res(); s.onerror = () => rej(new Error("leaflet load fail")); document.head.appendChild(s); });
      }
      L = (window as unknown as { L: { map: (id: string, o: unknown) => unknown; tileLayer: (url: string, o: unknown) => { addTo: (m: unknown) => void }; marker: (ll: unknown, o: unknown) => unknown; circle: (ll: unknown, o: unknown) => unknown; latLng: (a: number, b: number) => unknown } }).L;
      const el = document.getElementById("dudi-map"); if (!el || el.hasAttribute("data-inited")) return; el.setAttribute("data-inited", "1");
      const m = L.map("dudi-map", { zoomControl: false }) as unknown as { setView: (ll: unknown, z: number) => unknown; on: (ev: string, cb: (e: { latlng: { lat: number; lng: number } }) => void) => void; invalidateSize: () => void; remove: () => void };
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OSM" }).addTo(m);
      m.setView(L.latLng(lat, lng), 16);
      // openmap pin + radius circle khas Pulse #7c3aed
      const mk = (L as unknown as { marker: (ll: unknown, o: unknown) => { addTo: (mm: unknown) => unknown; on: (ev: string, cb: () => void) => void; getLatLng: () => { lat: number; lng: number } } }).marker(L.latLng(lat, lng), { draggable: true });
      (mk as unknown as { addTo: (mm: unknown) => void }).addTo(m);
      const cc = (L as unknown as { circle: (ll: unknown, o: unknown) => { addTo: (mm: unknown) => unknown; setLatLng: (ll: unknown) => void; setRadius: (r: number) => void } }).circle(L.latLng(lat, lng), { radius: radiusM, color: "#7c3aed", fillColor: "#7c3aed", fillOpacity: 0.12, weight: 2 });
      (cc as unknown as { addTo: (mm: unknown) => void }).addTo(m);
      (m as unknown as { on: (ev: string, cb: (e: { latlng: { lat: number; lng: number } }) => void) => void }).on("click", (e: { latlng: { lat: number; lng: number } }) => { (mk as unknown as { setLatLng: (ll: unknown) => void }).setLatLng(L.latLng(e.latlng.lat, e.latlng.lng)); (cc as unknown as { setLatLng: (ll: unknown) => void }).setLatLng(L.latLng(e.latlng.lat, e.latlng.lng)); onMove(e.latlng.lat, e.latlng.lng); });
      (mk as unknown as { on: (ev: string, cb: () => void) => void }).on("dragend", () => { const ll = (mk as unknown as { getLatLng: () => { lat: number; lng: number } }).getLatLng(); (cc as unknown as { setLatLng: (ll: unknown) => void }).setLatLng(L.latLng(ll.lat, ll.lng)); onMove(ll.lat, ll.lng); });
      // radius update via effect — store refs for later
      (el as unknown as { _leafletCircle?: unknown })._leafletCircle = cc;
      setTimeout(() => (m as unknown as { invalidateSize: () => void }).invalidateSize(), 200);
      map = m; marker = mk; circle = cc;
    }
    init();
    return () => { try { (map as unknown as { remove?: () => void })?.remove?.(); document.getElementById("dudi-map")?.removeAttribute("data-inited"); } catch {} };
  }, []);
  // update circle radius when slider moves
  useEffect(() => {
    const el = document.getElementById("dudi-map") as unknown as { _leafletCircle?: { setRadius: (r: number) => void } } | null;
    el?._leafletCircle?.setRadius(radiusM);
  }, [radiusM]);
  // recenter when lat/lng from geolocation button (outside map) — also move marker
  useEffect(() => {
    const L2 = (window as unknown as { L?: { latLng: (a: number, b: number) => unknown } }).L;
    const el = document.getElementById("dudi-map") as unknown as { _leafletMap?: unknown } | null;
    // marker updated via remount when lat/lng changes externally; Leaflet marker drag already syncs via onMove
    void L2; void el;
  }, [lat, lng]);
  return null;
}
