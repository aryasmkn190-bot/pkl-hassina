"use client";
import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function cn(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" "); }

type JurnalRow = { id: string; judul: string; kegiatan: string; status: string; feedback: string | null; foto: string[]; createdAt: string; siswa: { nis: string; name: string; kelas: string; dudi: { name: string } } };
type Tab = "jurnal" | "absensi" | "rekap";

export default function PembimbingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("jurnal");
  const [toast, setToast] = useState<string | null>(null);
  const [antrian, setAntrian] = useState<JurnalRow[]>([]);
  const [rekap, setRekap] = useState<Array<{ nis: string; nama: string; kelas: string; dudi: string; hadir: number; izin: number; antri: number }>>([]);
  const [ajuanAbs, setAjuanAbs] = useState<Array<{ id: string; type: string; status: string; tanggal: string; alasan: string; buktiFoto: string | null; siswa: { nis: string; name: string; kelas: string; dudi: { name: string } } }>>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const pop = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3200); };
  const [detail, setDetail] = useState<null | { id: string; judul: string; kegiatan: string; kendala: string | null; foto: string[]; siswa: { name: string; nis: string; kelas: string; dudi: { name: string } }; createdAt: string }>(null);
  const [detailKomen, setDetailKomen] = useState<Array<{ id: string; authorName: string; authorRole: string; isi: string; parentId: string | null; createdAt: string }>>([]);
  const [komenIsi, setKomenIsi] = useState(""); const [replyTo, setReplyTo] = useState<string|null>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  // role guard: SUPERADMIN redirect ke /admin
  useEffect(() => {
    const role = (session as unknown as { user?: { role: string } })?.user?.role;
    if (role === "SUPERADMIN") router.replace("/admin");
    if (role === "SISWA") router.replace("/siswa");
  }, [session, router]);

  async function loadJurnal() {
    setLoading(true);
    try {
      const r = await fetch("/api/pembimbing/jurnal?status=SEMUA&take=30");
      const j = await r.json();
      if (r.ok && Array.isArray(j.data)) setAntrian(j.data);
    } finally { setLoading(false); }
  }
  async function loadRekap() {
    try {
      const r = await fetch("/api/pembimbing/rekap");
      const j = await r.json();
      if (r.ok && Array.isArray(j.data)) setRekap(j.data);
    } catch {}
  }
  async function loadAjuanAbs() {
    try { const r = await fetch("/api/pembimbing/absensi-ajuan?status=MENUNGGU"); const j = await r.json(); if (r.ok && Array.isArray(j.data)) setAjuanAbs(j.data); } catch {}
  }
  useEffect(() => { loadJurnal(); loadRekap(); loadAjuanAbs(); }, []);
  useEffect(() => { if (tab === "jurnal") loadJurnal(); if (tab === "rekap") loadRekap(); if (tab === "absensi") loadAjuanAbs(); }, [tab]);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/lucide@latest";
    s.onload = () => (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons();
    document.head.appendChild(s);
    return () => s.remove();
  }, [tab, antrian.length]);

  useEffect(() => { (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons(); }, [tab]);

  async function approve(id: string, action: "approve" | "revisi", feedback?: string) {
    const r = await fetch(`/api/jurnal/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, feedback }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { pop(j.error ?? "Gagal."); return; }
    pop(action === "approve" ? "Jurnal disetujui ✓" : "Diminta revisi ✓");
    setAntrian((a) => a.filter((x) => x.id !== id));
    loadRekap();
  }
  async function putusanAjuan(id: string, aksi: "DISETUJUI" | "DITOLAK") {
    const feedback = aksi === "DITOLAK" ? (prompt("Alasan ditolak:")?.trim() || "") : undefined;
    if (aksi === "DITOLAK" && !feedback) return;
    const r = await fetch(`/api/pembimbing/absensi-ajuan/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aksi, feedback }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return pop(j.error ?? "Gagal.");
    pop(aksi === "DISETUJUI" ? `Ajuan disetujui → ${j.absensiStatus} ✓` : "Ajuan ditolak");
    setAjuanAbs((a) => a.filter((x) => x.id !== id)); loadRekap();
  }

  const filtered = rekap.filter((s) => !q || `${s.nama} ${s.nis} ${s.kelas} ${s.dudi}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[var(--palette-background)] pb-28 relative">
      {/* Pulse header — pro minimal */}
      <header className="sticky top-0 z-30" style={{ background: "var(--palette-surface)", borderBottom: "1px solid var(--palette-border)" }}>
        <div className="px-6 pt-6 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-hassina.jpg" alt="SMK HASSINA" className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid var(--palette-border)" }} />
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-none" style={{ color: "var(--palette-foreground-ink)" }}>SMK HASSINA</p>
              <p className="text-[11px] leading-none mt-0.5" style={{ color: "var(--palette-foreground-muted)" }}>Pembimbing · {tab === "jurnal" ? "Jurnal" : tab === "absensi" ? "Ajuan absen" : "Rekap"}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background: "var(--palette-surface-muted)", color: "var(--palette-foreground-muted)" }}><i data-lucide="log-out" className="w-4 h-4" /></button>
        </div>
        <div className="px-6 pb-3 flex gap-1.5">
          <button onClick={() => setTab("jurnal")} className={cn("flex-1 rounded-full py-2 text-[12px] font-bold", tab === "jurnal" ? "text-white shadow" : "")} style={tab === "jurnal" ? { background: "var(--palette-primary)" } : { background: "var(--palette-surface-muted)", color: "var(--palette-foreground-muted)" }}>
            Jurnal ({antrian.length})
          </button>
          <button onClick={() => setTab("absensi")} className={cn("flex-1 rounded-full py-2 text-[12px] font-bold", tab === "absensi" ? "text-white shadow" : "")} style={tab === "absensi" ? { background: "var(--palette-primary)" } : { background: "var(--palette-surface-muted)", color: "var(--palette-foreground-muted)" }}>
            Absen {ajuanAbs.length > 0 ? `(${ajuanAbs.length})` : ""}
          </button>
          <button onClick={() => setTab("rekap")} className={cn("flex-1 rounded-full py-2 text-[12px] font-bold", tab === "rekap" ? "text-white shadow" : "")} style={tab === "rekap" ? { background: "var(--palette-primary)" } : { background: "var(--palette-surface-muted)", color: "var(--palette-foreground-muted)" }}>
            Rekap
          </button>
        </div>
        {tab === "rekap" && (
          <div className="px-6 pb-3"><div className="rounded-full py-2.5 px-4 flex items-center" style={{ background: "var(--palette-surface-muted)", color: "var(--palette-foreground-muted)" }}><i data-lucide="search" className="w-4 h-4 mr-2" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari siswa, NIS..." className="bg-transparent outline-none w-full text-sm flex-1" style={{ color: "var(--palette-foreground)" }} /></div></div>
        )}
      </header>

      <main className="px-6 pt-4 space-y-4">
        {tab === "jurnal" && (
          <>
            {loading ? (
              <div className="rounded-2xl p-8 text-center text-[13px] ring-1" style={{ background: "var(--palette-surface)", color: "var(--palette-foreground-muted)", borderColor: "var(--palette-border)" }}>Memuat jurnal...</div>
            ) : antrian.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                <div className="w-12 h-12 rounded-full mx-auto grid place-items-center" style={{ background: "var(--palette-primary-subtle)" }}><i data-lucide="book-open" className="w-6 h-6" style={{ color: "var(--palette-primary)" }} /></div>
                <p className="mt-3 text-[13px] font-bold" style={{ color: "var(--palette-foreground)" }}>Belum ada jurnal</p>
                <p className="text-[12px]" style={{ color: "var(--palette-foreground-muted)" }}>Jurnal siswa akan muncul di sini — Anda bisa melihat detail & memberi komentar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {antrian.map((j) => (
                  <div key={j.id} className="rounded-2xl p-4" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold line-clamp-2" style={{ color: "var(--palette-foreground-ink)" }}>{j.judul}</p>
                        <p className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: "var(--palette-foreground-muted)" }}><i data-lucide="user" className="w-3 h-3" />{j.siswa.name} · {j.siswa.nis}</p>
                        <p className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--palette-foreground-muted)" }}><i data-lucide="building-2" className="w-3 h-3" />{j.siswa.kelas} · {j.siswa.dudi.name}</p>
                      </div>
                      <span className="shrink-0 h-fit rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "var(--palette-warning-subtle)", color: "var(--palette-warning)" }}>menunggu</span>
                    </div>
                    <p className="mt-3 text-[12px] leading-relaxed line-clamp-4" style={{ color: "var(--palette-foreground-secondary)" }}>{j.kegiatan}</p>
                    {j.foto?.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {j.foto.map((src) => (
                          <a key={src} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt="foto" className="h-20 w-20 shrink-0 rounded-xl object-cover" style={{ border: "1px solid var(--palette-border)" }} /></a>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>{new Date(j.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} {(j as unknown as { _count?: { komentar?: number }})._count?.komentar ? `· ${(j as unknown as { _count: { komentar: number }})._count.komentar} komentar` : ""}</p>
                    <button onClick={async()=>{ const r=await fetch(`/api/jurnal/${j.id}/komentar`); const js=await r.json().catch(()=>({})); setDetailKomen(Array.isArray(js.komentar)?js.komentar:[]); setDetail({ id:j.id, judul:j.judul, kegiatan:j.kegiatan, kendala:(j as unknown as { kendala?: string | null }).kendala ?? null, foto:j.foto ?? [], siswa:j.siswa, createdAt:j.createdAt }); setKomenIsi(""); setReplyTo(null); }} className="mt-3 w-full rounded-full py-2.5 text-[13px] font-bold flex items-center justify-center gap-1.5" style={{ background: "var(--palette-primary)", color: "white" }}>Lihat detail & Komentar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "absensi" && (
          <>
            <div className="flex justify-between items-center"><p className="text-[12px] font-bold" style={{ color: "var(--palette-foreground-muted)" }}>Ajuan menunggu ({ajuanAbs.length})</p><button onClick={loadAjuanAbs} className="text-[11px] font-bold" style={{ color: "var(--palette-primary)" }}>Muat ulang</button></div>
            {ajuanAbs.length === 0 ? <div className="rounded-2xl p-8 text-center text-[13px]" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}><p className="font-bold">Tidak ada ajuan</p><p className="text-[11px] mt-1" style={{ color: "var(--palette-foreground-muted)" }}>Sakit / izin / terlewat akan muncul di sini.</p></div> : (
              <div className="space-y-3">
                {ajuanAbs.map((a) => (
                  <div key={a.id} className="rounded-2xl p-4" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                    <div className="flex justify-between gap-2 items-start">
                      <div className="min-w-0"><p className="text-[13px] font-bold">{a.siswa.name} · {a.siswa.nis}</p><p className="text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>{a.siswa.kelas} · {a.siswa.dudi.name} · {new Date(a.tanggal).toLocaleDateString("id-ID")}</p></div>
                      <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold text-white" style={{ background: a.type === "SAKIT" ? "#ef4444" : a.type === "IZIN" ? "#f59e0b" : "#7c3aed" }}>{a.type}</span>
                    </div>
                    <p className="mt-2 text-[12px] leading-snug" style={{ color: "var(--palette-foreground-secondary)" }}>{a.alasan}</p>
                    {a.buktiFoto && <a href={a.buktiFoto} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded-xl overflow-hidden" style={{ border: "1px solid var(--palette-border)" }}><img src={a.buktiFoto} alt="bukti" className="h-28 w-auto object-cover" /></a>}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => putusanAjuan(a.id, "DISETUJUI")} className="rounded-full py-2.5 text-[12px] font-bold text-white flex items-center justify-center gap-1" style={{ background: "var(--palette-success)" }}><i data-lucide="check" className="w-4 h-4" /> Setujui</button>
                      <button onClick={() => putusanAjuan(a.id, "DITOLAK")} className="rounded-full py-2.5 text-[12px] font-bold" style={{ border: "1px solid var(--palette-border)" }}>Tolak</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "rekap" && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-[12px] font-bold" style={{ color: "var(--palette-foreground-muted)" }}>{filtered.length} siswa{bimbinganScopeNote(session) && <span> · bimbingan Anda</span>}</p>
              <a href="/api/pembimbing/rekap?format=csv" className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{ background: "var(--palette-surface)", color: "var(--palette-primary)", border: "1px solid var(--palette-border)" }}>⬇ CSV</a>
            </div>
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="rounded-2xl p-8 text-center text-[13px]" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>Belum ada data.</div>
              ) : filtered.map((s) => (
                <div key={s.nis} className="rounded-2xl px-4 py-3 flex justify-between items-center" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--palette-foreground-ink)" }}>{s.nama}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--palette-foreground-muted)" }}>{s.nis} · {s.kelas} · {s.dudi}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 ml-3">
                    <span className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold" style={{ background: "var(--palette-success-subtle)", color: "var(--palette-success)" }}>{s.hadir}</span>
                    {s.antri > 0 && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--palette-warning-subtle)", color: "var(--palette-warning)" }}>{s.antri} antri</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <div className="mx-6 mt-6 flex gap-2">
        <a href="/admin" className="flex-1 rounded-full py-2.5 text-center text-[12px] font-bold hidden" id="to-admin-link">Admin →</a>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex-1 rounded-full py-3 text-sm font-bold" style={{ background: "var(--palette-surface)", color: "var(--palette-foreground)", border: "1px solid var(--palette-border)" }}>Keluar</button>
      </div>

      {/* bottom nav — same Pulse glass-pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[86%] max-w-[360px] z-30">
        <div className="rounded-full py-3 px-6 flex justify-between items-center shadow-lg" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
          <button onClick={() => setTab("jurnal")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "jurnal" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="inbox" className="w-5 h-5" /></button>
          <button onClick={() => setTab("absensi")} className="w-10 h-10 rounded-full grid place-items-center relative" style={tab === "absensi" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="calendar-check" className="w-5 h-5" />{ajuanAbs.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}</button>
          <button onClick={() => setTab("rekap")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "rekap" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="bar-chart-3" className="w-5 h-5" /></button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-10 h-10 rounded-full grid place-items-center" style={{ color: "var(--palette-foreground-muted)" }}><i data-lucide="user" className="w-5 h-5" /></button>
        </div>
      </div>

      
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={()=>setDetail(null)}>
          <div className="w-full max-w-[560px] max-h-[88vh] overflow-auto rounded-t-3xl sm:rounded-2xl bg-white p-4 sm:p-5" onClick={(e)=>e.stopPropagation()}>
            <div className="flex justify-between gap-2"><div><p className="text-[14px] font-bold" style={{ color:"var(--palette-foreground-ink)" }}>{detail.judul}</p><p className="text-[11px]" style={{ color:"var(--palette-foreground-muted)" }}>{detail.siswa.name} · {detail.siswa.nis} · {detail.siswa.kelas} · {detail.siswa.dudi.name} · {new Date(detail.createdAt).toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})}</p>{detail.kendala && <p className="text-[11px] mt-1" style={{ color:"#dc2626" }}>Kendala: {detail.kendala}</p>}</div><button onClick={()=>setDetail(null)} className="shrink-0 w-8 h-8 rounded-full grid place-items-center" style={{ background:"var(--palette-surface-muted)" }}>×</button></div>
            <p className="mt-3 text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color:"var(--palette-foreground-ink)" }}>{detail.kegiatan}</p>
            {detail.foto?.length>0 && <div className="mt-3 grid grid-cols-3 gap-2">{detail.foto.slice(0,5).map((s,i)=>(<a key={i} href={s} target="_blank"><img src={s} alt="doc" className="w-full h-28 rounded-xl object-cover" style={{ border:"1px solid var(--palette-border)" }}/></a>))}</div>}
            <div className="mt-4 pt-3" style={{ borderTop:"1px solid var(--palette-border)" }}>
              <p className="text-[12px] font-bold">Komentar — tap komentar untuk balas</p>
              <div className="mt-2 space-y-2 max-h-[32vh] overflow-auto pr-1">
                {detailKomen.length===0 ? <p className="text-[11px]" style={{ color:"var(--palette-foreground-muted)" }}>Belum ada komentar.</p> : detailKomen.map(k=>(
                  <div key={k.id} onClick={()=>setReplyTo(k.id)} className={`rounded-2xl p-2.5 cursor-pointer ${replyTo===k.id ? "ring-2 ring-[var(--palette-primary)]":""}`} style={{ background: k.authorRole==="SISWA" ? "var(--palette-surface-muted)" : "var(--palette-primary-subtle)", border:"1px solid var(--palette-border)" }}>
                    <p className="text-[11px] font-bold">{k.authorName} <span className="font-normal" style={{ color:"var(--palette-foreground-muted)"}}>· {k.authorRole}</span> {k.parentId ? "↳ balas":""}</p>
                    <p className="text-[12px] mt-0.5 whitespace-pre-wrap">{k.isi}</p>
                    <p className="text-[10px] mt-1" style={{ color:"var(--palette-foreground-muted)" }}>{new Date(k.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </div>
              {replyTo && <p className="text-[11px] mt-1">Balas ke <b>{detailKomen.find(x=>x.id===replyTo)?.authorName ?? replyTo.slice(0,6)}</b> <button onClick={()=>setReplyTo(null)} className="underline" style={{ color:"var(--palette-primary)"}}>batal</button></p>}
              <div className="mt-2 flex gap-2">
                <input value={komenIsi} onChange={e=>setKomenIsi(e.target.value)} placeholder={replyTo ? "Tulis balasan..." : "Tulis komentar..."} className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none" style={{ border:"1px solid var(--palette-border)" }} />
                <button onClick={async()=>{ if(komenIsi.trim().length<2) return; const r=await fetch(`/api/jurnal/${detail.id}/komentar`,{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ isi:komenIsi.trim(), parentId: replyTo })}); const js=await r.json().catch(()=>({})); if(!r.ok) return pop(js.error ?? "Gagal"); setKomenIsi(""); setReplyTo(null); const r2=await fetch(`/api/jurnal/${detail.id}/komentar`); const j2=await r2.json().catch(()=>({})); setDetailKomen(Array.isArray(j2.komentar)?j2.komentar:[]); pop("Komentar terkirim ✓"); }} className="rounded-full px-5 py-2.5 text-sm font-bold text-white shrink-0" style={{ background:"var(--palette-primary)" }}>Kirim</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-[86%] max-w-[360px]"><div className="rounded-2xl px-4 py-3 text-[13px] font-medium text-white shadow-xl text-center" style={{ background: "var(--palette-foreground-ink)" }}>{toast}</div></div>}
    </div>
  );
}

function bimbinganScopeNote(session: unknown) {
  const role = (session as unknown as { user?: { role: string } })?.user?.role;
  return role === "PEMBIMBING";
}
