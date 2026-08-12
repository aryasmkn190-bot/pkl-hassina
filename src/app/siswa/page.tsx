"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function cn(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" "); }

type TabId = "beranda" | "absensi" | "jurnal" | "profil";

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("beranda");
  const [toast, setToast] = useState<string | null>(null);
  const [jurnalDraft, setJurnalDraft] = useState({ judul: "", kegiatan: "", kendala: "" });
  const [jurnalBusy, setJurnalBusy] = useState(false);
  const [absenBusy, setAbsenBusy] = useState(false);
  const [jurnalReal, setJurnalReal] = useState<Array<{ id: string; judul: string; kegiatan: string; tanggal: string; tanggalIso?: string; foto: string[]; jamMulai: string | null; jamSelesai: string | null; status: string; feedback: string | null }>>([]);
  const [mustChange, setMustChange] = useState(false);
  const pop = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const todayIso = new Date().toLocaleString("en-CA", { timeZone: "Asia/Jakarta" }).slice(0,10);

  // kalender jurnal Pulse
  const [kalBulan, setKalBulan] = useState(() => new Date());
  const [kalSheetOpen, setKalSheetOpen] = useState(false);
  const [kalSheetDate, setKalSheetDate] = useState<string | null>(null);
  const [kalEditing, setKalEditing] = useState<{ id: string; judul: string; kegiatan: string; kendala: string | null; foto: string[]; status: string; feedback: string | null } | null>(null);
  const [keepFoto, setKeepFoto] = useState<string[]>([]);
  const [kalListOpen, setKalListOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toLocaleString("en-CA", { timeZone: "Asia/Jakarta" }).slice(0,10));
  const [detailJurnal, setDetailJurnal] = useState<null | { id: string; judul: string; kegiatan: string; kendala: string | null; foto: string[]; tanggalIso?: string }>(null);
  const [detailKomentar, setDetailKomentar] = useState<Array<{ id: string; authorName: string; authorRole: string; isi: string; parentId: string | null; createdAt: string }>>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [komentarIsi, setKomentarIsi] = useState("");
  const [kalSheetList, setKalSheetList] = useState<Array<{ id: string; judul: string; status: string; feedback: string | null }>>([]);
  const jurnalByDate: Record<string, typeof jurnalReal> = (() => {
    const m: Record<string, typeof jurnalReal> = {};
    for (const j of jurnalReal) {
      const raw = (j as unknown as { tanggalIso?: string }).tanggalIso as string | undefined;
      const iso = raw ?? (j.tanggal.includes("-") ? j.tanggal : new Date(j.tanggal).toISOString().slice(0, 10));
      // normalize: if j.tanggal is "12 Agu 2026" etc, try to parse via createdAt fallback
      const key = iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : new Date().toISOString().slice(0, 10);
      (m[key] ??= []).push(j);
    }
    return m;
  })();
  const kalCells: Array<Date | null> = (() => {
    const y = kalBulan.getFullYear(), m = kalBulan.getMonth();
    const first = new Date(y, m, 1);
    const startPad = (first.getDay() + 6) % 7; // Senin=0
    const days = new Date(y, m + 1, 0).getDate();
    const arr: Array<Date | null> = Array(startPad).fill(null);
    for (let d = 1; d <= days; d++) arr.push(new Date(y, m, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  })();
  function openJurnalSheet(iso: string | null, existing: { id: string; judul: string; kegiatan: string; kendala: string | null; foto: string[]; status: string; feedback: string | null } | null) {
    setKalSheetDate(iso ?? new Date().toISOString().slice(0, 10));
    if (existing) {
      setKalEditing(existing);
      setJurnalDraft({ judul: existing.judul, kegiatan: existing.kegiatan, kendala: existing.kendala ?? "" });
      setKeepFoto(existing.foto ?? []);
    } else {
      setKalEditing(null);
      setJurnalDraft({ judul: "", kegiatan: "", kendala: "" });
      setKeepFoto([]);
    }
    setKalSheetOpen(true);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAbsenType = useRef<"masuk" | "pulang">("masuk");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [camType, setCamType] = useState<"masuk" | "pulang">("masuk");
  const [gps, setGps] = useState<{ lat: number; lng: number; acc: number | null; jarakM: number | null } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  async function openCamera(type: "masuk" | "pulang") {
    setCamType(type); setCamOpen(true); setGps(null);
    setTimeout(async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      } catch { pop("Kamera tidak dapat dibuka. Izinkan kamera."); }
    }, 100);
    // GPS highAccuracy + 20s timeout, tampilkan akurasi & jarak preview
    setGpsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        if (!navigator.geolocation) return rej(new Error("GPS tidak tersedia"));
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
      });
      // ambil dudi lat/lng dari profil live (fallback -6.9/106.9)
      const dLat = profilData?.dudi?.lat ?? -6.9, dLng = profilData?.dudi?.lng ?? 106.9;
      const j = haversineM(pos.coords.latitude, pos.coords.longitude, dLat, dLng);
      setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy), jarakM: j });
    } catch (e: unknown) { pop(e instanceof Error ? e.message : "GPS gagal — pastikan lokasi aktif."); }
    finally { setGpsLoading(false); }
  }
  function closeCamera() {
    const s = (videoRef.current?.srcObject as MediaStream | null);
    s?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOpen(false);
  }

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error("GPS tidak tersedia di perangkat ini."));
      navigator.geolocation.getCurrentPosition(res, (e) => rej(new Error(e.message || "Gagal ambil lokasi. Aktifkan GPS & izinkan akses.")), { enableHighAccuracy: true, timeout: 15000 });
    });
  }

  async function doAbsen(type: "masuk" | "pulang", file?: File | null) {
    // legacy fallback jika ada file input (jurnal foto tetap pakai capture fallback)
    if (file) {
      setAbsenBusy(true);
      try {
        let lat: number | null = null, lng: number | null = null, acc: number | null = null;
        try { const pos = await getPosition(); lat = pos.coords.latitude; lng = pos.coords.longitude; acc = Math.round(pos.coords.accuracy); } catch {}
        const fd = new FormData(); fd.set("type", type);
        if (lat != null) fd.set("lat", String(lat)); if (lng != null) fd.set("lng", String(lng)); if (acc != null) fd.set("accuracy", String(acc));
        fd.set("foto", file);
        const r = await fetch("/api/absensi", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({})); if (!r.ok) { pop(j.error ?? "Gagal absen."); return; }
        pop((type === "masuk" ? "Masuk" : "Pulang") + " tercatat ✓" + (j.jarakM != null ? ` · ${j.jarakM}m` : ""));
      } finally { setAbsenBusy(false); }
      return;
    }
    setAbsenBusy(true);
    try {
      let lat: number | null = null, lng: number | null = null, acc: number | null = null;
      if (gps) { lat = gps.lat; lng = gps.lng; acc = gps.acc; }
      else try { const pos = await getPosition(); lat = pos.coords.latitude; lng = pos.coords.longitude; acc = Math.round(pos.coords.accuracy); } catch (e: unknown) { pop(e instanceof Error ? e.message : String(e)); return; }
      const fd = new FormData(); fd.set("type", type);
      if (lat != null) fd.set("lat", String(lat)); if (lng != null) fd.set("lng", String(lng)); if (acc != null) fd.set("accuracy", String(acc));
      // file sudah disiapkan via canvas (handled di capture handler) — fallback tanpa foto untuk pulang
      const r = await fetch("/api/absensi", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({})); if (!r.ok) { pop(j.error ?? "Gagal absen."); return; }
      pop((type === "masuk" ? "Masuk" : "Pulang") + " tercatat ✓" + (j.jarakM != null ? ` · ${j.jarakM}m` : ""));
    } finally { setAbsenBusy(false); }
  }

  async function captureAndAbsen() {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 640, h = video.videoHeight || 480;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!; ctx.drawImage(video, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) { pop("Gagal ambil foto."); return; }
    const file = new File([blob], `selfie-${camType}.jpg`, { type: "image/jpeg" });
    // kirim langsung dengan gps state
    setAbsenBusy(true);
    try {
      const fd = new FormData(); fd.set("type", camType);
      if (gps) { fd.set("lat", String(gps.lat)); fd.set("lng", String(gps.lng)); if (gps.acc != null) fd.set("accuracy", String(gps.acc)); }
      else { // fallback minta GPS cepat
        try { const pos = await getPosition(); fd.set("lat", String(pos.coords.latitude)); fd.set("lng", String(pos.coords.longitude)); fd.set("accuracy", String(Math.round(pos.coords.accuracy))); } catch {}
      }
      fd.set("foto", file);
      const r = await fetch("/api/absensi", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { pop(j.error ?? "Gagal absen."); return; }
      pop((camType === "masuk" ? "Masuk" : "Pulang") + " tercatat ✓" + (j.jarakM != null ? ` · ${j.jarakM}m` : ""));
      closeCamera();
    } finally { setAbsenBusy(false); }
  }

  function triggerAbsen(type: "masuk" | "pulang") { openCamera(type); }

  useEffect(() => {
    const m = (session as unknown as { user?: { mustChangePassword?: boolean } })?.user?.mustChangePassword;
    setMustChange(!!m);
  }, [session]);

  async function refreshJurnal() {
    try {
      const r = await fetch("/api/jurnal");
      const j = await r.json();
      if (Array.isArray(j.data)) setJurnalReal(j.data.map((x: { id: string; judul: string; kegiatan: string; tanggal: string; tanggalIso: string; jamMulai: string | null; jamSelesai: string | null; status: string; feedback: string | null; foto: string[] }) => ({ ...x, tanggal: x.tanggalIso ? new Date(x.tanggalIso + "T12:00:00").toLocaleDateString("id-ID") : new Date(x.tanggal).toLocaleDateString("id-ID"), tanggalIso: x.tanggalIso ?? new Date(x.tanggal).toISOString().slice(0,10) })) as unknown as typeof jurnalReal);
    } catch {}
  }
  useEffect(() => { refreshJurnal(); }, []);
  const [profilData, setProfilData] = useState<{ nis: string; name: string; kelas: string; jurusan: string; noHp: string | null; foto: string | null; dudi: { id: string; name: string; alamat: string; pimpinan: string | null; noTelp: string | null; lat: number; lng: number; radiusM: number } } | null>(null);
  const [profilEditOpen, setProfilEditOpen] = useState(false);
  const [profilDraft, setProfilDraft] = useState({ name: "", kelas: "", jurusan: "", noHp: "", pimpinan: "", alamat: "", noTelp: "" });
  async function loadProfil() {
    try { const r = await fetch("/api/siswa/profil"); const j = await r.json(); if (r.ok && j.data) { setProfilData(j.data); setProfilDraft({ name: j.data.name ?? "", kelas: j.data.kelas ?? "", jurusan: j.data.jurusan ?? "", noHp: j.data.noHp ?? "", pimpinan: j.data.dudi?.pimpinan ?? "", alamat: j.data.dudi?.alamat ?? "", noTelp: j.data.dudi?.noTelp ?? "" }); } } catch {}
  }
  useEffect(() => { loadProfil(); }, []);

  // lucide icons (Pulse uses unpkg lucide)
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/lucide@latest";
    s.onload = () => { (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons(); };
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, [tab]);

  useEffect(() => { (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons(); }, [tab]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[var(--palette-background)] pb-28 relative">
      {/* ===== PULSE HEADER — pro minimal ===== */}
      <header className="sticky top-0 z-30" style={{ background: "var(--palette-surface)", borderBottom: "1px solid var(--palette-border)" }}>
        <div className="px-6 pt-6 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-hassina.jpg" alt="SMK HASSINA" className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid var(--palette-border)" }} />
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-none" style={{ color: "var(--palette-foreground-ink)" }}>SMK HASSINA</p>
              <p className="text-[11px] leading-none mt-0.5" style={{ color: "var(--palette-foreground-muted)" }}>PKL · {tab === "beranda" ? "Beranda" : tab === "absensi" ? "Absensi" : tab === "jurnal" ? "Jurnal" : "Profil"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold hidden sm:block truncate max-w-[140px]" style={{ color: "var(--palette-foreground-muted)" }}>{profilData?.name ?? "—"}</span>
            <button onClick={() => setTab("profil")} className="w-9 h-9 rounded-full overflow-hidden" style={{ border: "1px solid var(--palette-border)" }}><img src={profilData?.foto ?? "/logo-hassina.jpg"} alt="profil" className="w-full h-full object-cover" /></button>
          </div>
        </div>
      </header>

      {/* Siswa strip — subtle, not in Pulse but functional */}
      {mustChange && (
        <div className="mx-6 mt-3 rounded-2xl p-3 flex items-center justify-between gap-3" style={{ background: "var(--palette-warning-subtle)", border: "1px solid var(--palette-warning-muted)" }}>
          <p className="text-[12px] font-semibold" style={{ color: "var(--palette-warning-active)" }}>Password awal wajib diganti.</p>
          <button onClick={() => router.push("/ganti-password")} className="rounded-full px-4 py-2 text-xs font-bold bg-white" style={{ color: "var(--palette-warning-active)", border: "1px solid var(--palette-warning-muted)" }}>Ganti sekarang</button>
        </div>
      )}
      <div className="mx-6 mt-3 flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
        <img src={profilData?.foto ?? "/logo-hassina.jpg"} alt={profilData?.name ?? "Siswa"} className="h-10 w-10 rounded-full object-cover" style={{ border: "2px solid var(--palette-border)" }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>{profilData?.name ?? "—"}</p>
          <p className="truncate text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>{profilData?.kelas ?? "—"} · {profilData?.nis ?? "—"}</p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "var(--palette-success-subtle)", color: "var(--palette-success-active)", border: "1px solid var(--palette-success-muted)" as unknown as string }}>Aktif PKL</span>
      </div>

      <main className="px-6 pt-4 space-y-4">
        {tab === "beranda" && (
          <div className="space-y-4">
            <div className="rounded-[28px] p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 55%, #5b21b6 100%)" }}>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute right-6 top-6 opacity-20">
                <div className="w-16 h-16 rounded-2xl bg-white/15 grid place-items-center text-white text-[24px]">✦</div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-white/15 text-white tracking-[0.06em] uppercase">PKL Aktif</span>
                  <span className="text-[11px] text-white/70">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}</span>
                </div>
                <p className="mt-3 text-[18px] font-extrabold leading-tight text-white">Halo, {(profilData?.name ?? "Siswa").split(" ")[0]} 👋</p>
                <p className="text-[12px] mt-1 text-white/80 leading-snug">{profilData?.dudi ? `PKL di ${profilData.dudi.name}` : "PKL SMK Hassina"} · <span className="text-white font-semibold">{profilData?.kelas ?? ""}</span></p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setTab("absensi")} className="flex-1 rounded-full py-3 text-[13px] font-extrabold bg-white shadow" style={{ color: "#6d28d9" }}>Absen sekarang →</button>
                  <button onClick={() => setTab("jurnal")} className="rounded-full px-5 py-3 text-[13px] font-bold bg-white/15 text-white" style={{ border: "1px solid rgba(255,255,255,0.22)" }}>Jurnal</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setTab("absensi")} className="rounded-2xl p-3 text-left" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                <div className="w-8 h-8 rounded-full grid place-items-center text-white text-[14px]" style={{ background: "var(--palette-primary)" }}>◷</div>
                <p className="mt-2 text-[11px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>Absensi</p>
                <p className="text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>Masuk / Izin / Sakit</p>
              </button>
              <button onClick={() => setTab("jurnal")} className="rounded-2xl p-3 text-left" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                <div className="w-8 h-8 rounded-full grid place-items-center" style={{ background: "#fef3c7", color: "#92400e" }}>✎</div>
                <p className="mt-2 text-[11px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>Jurnal</p>
                <p className="text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>Isi harian</p>
              </button>
              <button onClick={() => setTab("profil")} className="rounded-2xl p-3 text-left" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                <div className="w-8 h-8 rounded-full grid place-items-center text-white" style={{ background: "#0f172a" }}>◈</div>
                <p className="mt-2 text-[11px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>Profil</p>
                <p className="text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>DUDI & akun</p>
              </button>
            </div>
            <RecapCard />
            <RekomendasiHarian onJurnalCreated={async()=>{ try{ const r=await fetch("/api/jurnal"); const j=await r.json(); if(Array.isArray(j.data)) setJurnalReal(j.data.map((x:any)=>({ ...x, tanggal: x.tanggalIso ? new Date(x.tanggalIso+"T12:00:00").toLocaleDateString("id-ID") : new Date(x.tanggal).toLocaleDateString("id-ID"), tanggalIso: x.tanggalIso ?? new Date(x.tanggal).toISOString().slice(0,10) })) as any); }catch{} }} />
            {jurnalReal.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>
                <p className="text-[13px] font-bold" style={{ color: "var(--palette-foreground-ink)" }}>Belum ada jurnal</p>
                <p className="text-[11px] mt-1" style={{ color: "var(--palette-foreground-muted)" }}>Tap tanggal di kalender untuk menambah jurnal harianmu.</p>
                <button onClick={() => setTab("jurnal")} className="mt-3 rounded-full px-5 py-2 text-xs font-bold text-white" style={{ background: "var(--palette-primary)" }}>Buka kalender</button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-[13px] flex items-center gap-2" style={{ color: "var(--palette-foreground-ink)" }}><span className="w-7 h-7 rounded-full grid place-items-center text-[12px]" style={{ background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" }}>≡</span>Jurnal terbaru</h2><button onClick={() => setTab("jurnal")} className="rounded-full px-3 py-1.5 text-[11px] font-bold bg-white" style={{ color: "var(--palette-primary)", border: "1px solid var(--palette-border)" }}>Lihat semua →</button></div>
                <div className="space-y-2">
                  {jurnalReal.slice(0, 2).map((j) => (
                    <div key={j.id} className="rounded-2xl p-3.5" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", boxShadow: "var(--elevation-level1)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold line-clamp-1" style={{ color: "var(--palette-foreground-ink)" }}>{j.judul}</p>
                        <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={String(j.status) === "DISETUJUI" ? { background: "var(--palette-success-subtle)", color: "var(--palette-success-active)" } : String(j.status) === "REVISI" ? { background: "var(--palette-warning-subtle)", color: "var(--palette-warning-active)" } : { background: "var(--palette-surface-dark)", color: "var(--palette-foreground-secondary)" }}>{String(j.status)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-snug" style={{ color: "var(--palette-foreground-secondary)" }}>{j.kegiatan}</p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>{(j as unknown as { tanggalIso?: string }).tanggalIso ?? j.tanggal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "absensi" && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              doAbsen(pendingAbsenType.current, f);
              e.currentTarget.value = "";
            }} />
            <canvas ref={canvasRef} className="hidden" />
            <AbsensiModern profilData={profilData} absenBusy={absenBusy} triggerAbsen={triggerAbsen} pop={pop} />
            {camOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" onClick={closeCamera}>
                <div className="w-full max-w-[480px] rounded-3xl bg-white overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="relative bg-black aspect-[4/3]">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                      <span className="rounded-full px-3 py-1 text-[11px] font-bold bg-white/90">{camType === "masuk" ? "Masuk" : "Pulang"} · selfie</span>
                      <button onClick={closeCamera} className="w-8 h-8 rounded-full grid place-items-center bg-white/90"><i data-lucide="x" className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="rounded-2xl px-4 py-3" style={{ background: "var(--palette-surface-muted)", border: "1px solid var(--palette-border)" }}>
                      {gpsLoading ? <p className="text-[12px]" style={{ color: "var(--palette-foreground-muted)" }}>Mengukur GPS high-accuracy...</p> : gps ? (
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold" style={{ color: gps.jarakM != null && gps.jarakM > (profilData?.dudi?.radiusM ?? 150) ? "#dc2626" : "var(--palette-success)" }}>{gps.jarakM != null ? `${gps.jarakM}m dari DUDI` : "—"} {gps.jarakM != null && gps.jarakM > (profilData?.dudi?.radiusM ?? 150) ? "· DI LUAR RADIUS" : "· dalam radius ✓"}</p>
                          <p className="text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>Akurasi ±{gps.acc ?? "?"}m · {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</p>
                        </div>
                      ) : <p className="text-[12px]" style={{ color: "var(--palette-foreground-muted)" }}>GPS belum siap — pastikan lokasi aktif.</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={closeCamera} className="rounded-full py-3 text-sm font-bold" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>Batal</button>
                      <button disabled={absenBusy || gpsLoading || (gps?.jarakM != null && gps.jarakM > (profilData?.dudi?.radiusM ?? 150))} onClick={captureAndAbsen} className="rounded-full py-3 text-sm font-bold text-white disabled:opacity-40" style={{ background: "var(--palette-primary)" }}>{absenBusy ? "..." : gps?.jarakM != null && gps.jarakM > (profilData?.dudi?.radiusM ?? 150) ? "Di luar radius" : "Ambil & Absen"}</button>
                    </div>
                    {gps?.jarakM != null && gps.jarakM > (profilData?.dudi?.radiusM ?? 150) && <p className="text-[11px] text-center" style={{ color: "#dc2626" }}>Titik di luar radius — absen akan ditolak. Dekati DUDI.</p>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "jurnal" && (
          <div className="space-y-4">
            {/* Kalender Pulse — bg gradient same as Target mingguan */}
            <div className="rounded-3xl p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 50%, #ddd6fe 100%)" }}>
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/40 rounded-full blur-2xl" />
              <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full blur-2xl" style={{ background: "rgba(124,58,237,0.14)" }} />
              <div className="relative z-10">
                <div className="flex justify-between items-center">
                  <button onClick={() => setKalBulan((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="w-8 h-8 rounded-full grid place-items-center bg-white/70"><i data-lucide="chevron-left" className="w-4 h-4" /></button>
                  <h3 className="font-bold text-[15px]" style={{ color: "var(--palette-foreground)" }}>{kalBulan.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</h3>
                  <button onClick={() => setKalBulan((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="w-8 h-8 rounded-full grid place-items-center bg-white/70"><i data-lucide="chevron-right" className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mt-4 text-center text-[11px] font-bold" style={{ color: "var(--palette-foreground-muted)" }}>
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {kalCells.map((c) => {
                    if (!c) return <div key={Math.random()} />;
                    const iso = c.toISOString().slice(0, 10);
                    const items = jurnalByDate[iso] ?? [];
                    const isSelected = iso === selectedDate;
                    const isToday = iso === todayIso;
                    const isFuture = c > new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <button
                        key={iso}
                        disabled={isFuture}
                        onClick={() => {
                          setSelectedDate(iso);
                          if (tab !== "jurnal") setTab("jurnal");
                        }}
                        className={`relative h-9 w-full rounded-xl flex flex-col items-center justify-center text-[13px] font-medium disabled:opacity-35 ${isSelected ? "ring-2 ring-[var(--palette-primary)] ring-offset-1" : ""}`}
                        style={isSelected ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : isToday ? { background: "var(--palette-primary)", color: "white" } : items.length ? { background: "white", color: "var(--palette-foreground)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "var(--palette-foreground-secondary)" }}
                      >
                        {c.getDate()}
                        {items.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: items.some((x) => String(x.status) === "DISETUJUI") ? "var(--palette-success)" : String(items[0].status) === "REVISI" ? "var(--palette-warning)" : "var(--palette-primary)" }} />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-center text-[11px]" style={{ color: "var(--palette-foreground-muted)" }}>Tap tanggal untuk tambah jurnal · ● ada entri · dot disetujui/harus revisi</p>
              </div>
            </div>

            {/* Sheet: tambah / edit jurnal per tanggal */}
            {kalSheetOpen && (
              <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/30 p-0 sm:p-4" onClick={() => setKalSheetOpen(false)}>
                <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-white p-5 max-h-[86vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="mx-auto h-1 w-10 rounded-full bg-slate-200 mb-3 sm:hidden" />
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold" style={{ color: "var(--palette-foreground-ink)" }}>{kalEditing ? "Edit jurnal" : "Jurnal baru"} — {kalSheetDate ? new Date(kalSheetDate + "T12:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}</h4>
                    <button onClick={() => setKalSheetOpen(false)} className="w-8 h-8 rounded-full grid place-items-center" style={{ background: "var(--palette-surface-muted)" }}><i data-lucide="x" className="w-4 h-4" /></button>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    <input value={jurnalDraft.judul} onChange={(e) => setJurnalDraft({ ...jurnalDraft, judul: e.target.value })} placeholder="Judul kegiatan" className="w-full rounded-full px-4 py-3 text-sm outline-none" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", color: "var(--palette-foreground)" }} />
                    <textarea value={jurnalDraft.kegiatan} onChange={(e) => setJurnalDraft({ ...jurnalDraft, kegiatan: e.target.value })} placeholder="Uraian komprehensif — tulis alat/bahan, langkah, hasil dalam satu uraian" rows={4} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", color: "var(--palette-foreground)" }} />
                    <textarea value={jurnalDraft.kendala} onChange={(e) => setJurnalDraft({ ...jurnalDraft, kendala: e.target.value })} placeholder="Kendala (opsional)" rows={2} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)", color: "var(--palette-foreground)" }} />
                    <input id="jurnal-foto2" type="file" accept="image/*" multiple className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--palette-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" style={{ color: "var(--palette-foreground-muted)" }} />
                    {kalEditing && keepFoto.length>0 && (<div className="flex gap-1.5 overflow-auto pt-1">{keepFoto.slice(0,5).map((s,i)=>(<div key={i} className="relative shrink-0"><img src={s} alt="keep" className="w-16 h-16 rounded-xl object-cover" style={{ border:"1px solid var(--palette-border)" }}/><button onClick={()=>setKeepFoto(keepFoto.filter((_,k)=>k!==i))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] grid place-items-center">x</button></div>))}<span className="text-[11px] self-center" style={{ color:"var(--palette-foreground-muted)" }}>{keepFoto.length}/5</span></div>)}
                    <div className="flex gap-2">
                      <button onClick={() => setKalSheetOpen(false)} className="flex-1 rounded-full py-3 text-sm font-bold" style={{ background: "var(--palette-surface)", border: "1px solid var(--palette-border)" }}>Batal</button>
                      <button disabled={jurnalBusy} onClick={async () => {
                        if (!jurnalDraft.judul || !jurnalDraft.kegiatan) return pop("Lengkapi judul & kegiatan.");
                        setJurnalBusy(true);
                        try {
                          const inp = document.getElementById("jurnal-foto2") as HTMLInputElement | null;
                          const files = inp?.files ? Array.from(inp.files).slice(0, 5) : [];
                          if (kalEditing) { // edit via multipart + keepFoto

                            const r = await (() => { const fd = new FormData(); fd.set("judul", jurnalDraft.judul); fd.set("kegiatan", jurnalDraft.kegiatan); if (jurnalDraft.kendala) fd.set("kendala", jurnalDraft.kendala); fd.set("tanggal", kalSheetDate ?? selectedDate); fd.set("keepFoto", JSON.stringify(keepFoto)); const files2 = Array.from(((document.getElementById("jurnal-foto2") as HTMLInputElement | null)?.files ?? []) as unknown as File[]); for (const f of files2.slice(0,5)) fd.append("foto", f); return fetch(`/api/jurnal/${kalEditing.id}`, { method: "PATCH", body: fd }); })();const j = await r.json().catch(() => ({})); if (!r.ok) { pop(j.error ?? "Gagal simpan."); return; }
                            pop("Jurnal diperbarui ✓"); setKalSheetOpen(false); setJurnalDraft({ judul: "", kegiatan: "", kendala: "" }); refreshJurnal();
                          } else {
                            let r: Response;
                            if (files.length > 0) {
                              const fd = new FormData(); fd.set("judul", jurnalDraft.judul); fd.set("kegiatan", jurnalDraft.kegiatan); if (jurnalDraft.kendala) fd.set("kendala", jurnalDraft.kendala); fd.set("tanggal", kalSheetDate ?? selectedDate); for (const f of files.slice(0,5)) fd.append("foto", f);
                              r = await fetch("/api/jurnal", { method: "POST", body: fd });
                            } else { const fd2 = new FormData(); fd2.set("judul", jurnalDraft.judul); fd2.set("kegiatan", jurnalDraft.kegiatan); if (jurnalDraft.kendala) fd2.set("kendala", jurnalDraft.kendala); fd2.set("tanggal", kalSheetDate ?? selectedDate); for (const f of Array.from(((document.getElementById("jurnal-foto2") as HTMLInputElement | null)?.files ?? []) as unknown as File[]).slice(0,5)) fd2.append("foto", f); r = await fetch("/api/jurnal", { method: "POST", body: fd2 }); }
                            const j = await r.json().catch(() => ({})); if (!r.ok) { pop(j.error ?? "Gagal kirim."); return; }
                            pop("Jurnal ditambahkan ✓"); setKalSheetOpen(false); setJurnalDraft({ judul: "", kegiatan: "", kendala: "" }); if (inp) inp.value = ""; refreshJurnal();
                          }
                        } finally { setJurnalBusy(false); }
                      }} className="flex-1 rounded-full py-3 text-sm font-bold disabled:opacity-60" style={{ background: "var(--palette-primary)", color: "white" }}>{kalEditing ? "Simpan" : "Kirim"} </button>
                    </div>
                    {kalEditing && kalEditing.status !== "DISETUJUI" && (
                      <button onClick={async () => {
                        if (!confirm("Hapus jurnal ini?")) return;
                        const r = await fetch(`/api/jurnal/${kalEditing.id}`, { method: "DELETE" });
                        const j = await r.json().catch(() => ({})); if (!r.ok) return pop(j.error ?? "Gagal hapus");
                        pop("Jurnal dihapus ✓"); setKalSheetOpen(false); refreshJurnal();
                      }} className="w-full text-[12px] font-bold py-2" style={{ color: "#dc2626" }}>Hapus jurnal</button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {kalListOpen && (
              <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/30 p-0 sm:p-4" onClick={() => setKalListOpen(false)}>
                <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-white p-5 max-h-[70vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold">{kalSheetDate} · {kalSheetList.length} jurnal</h4>
                    <button onClick={() => setKalListOpen(false)} className="w-8 h-8 rounded-full grid place-items-center bg-slate-100"><i data-lucide="x" className="w-4 h-4" /></button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {kalSheetList.map((j) => (
                      <div key={j.id} className="rounded-2xl p-3" style={{ border: "1px solid var(--palette-border)" }}>
                        <p className="font-bold text-sm">{j.judul}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--palette-foreground-muted)" }}>{j.status}{j.feedback ? ` · ${j.feedback}` : ""}</p>
                        <div className="mt-2 flex gap-2">
                          {String(j.status) !== "DISETUJUI" ? <button onClick={() => { setKalListOpen(false); openJurnalSheet(kalSheetDate, { ...j, foto: (j as unknown as { foto?: string[] }).foto ?? [], kegiatan: (j as unknown as { kegiatan?: string }).kegiatan ?? "", kendala: (j as unknown as { kendala?: string | null }).kendala ?? null }); }} className="flex-1 rounded-full py-2 text-xs font-bold" style={{ background: "var(--palette-primary)", color: "white" }}>Edit</button> : <span className="flex-1 text-center py-2 text-xs font-bold" style={{ color: "var(--palette-success)" }}>✓ Disetujui — terkunci</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-[15px]" style={{ color: "var(--palette-foreground)" }}>Jurnal saya — {new Date(selectedDate + "T12:00:00").toLocaleDateString("id-ID",{ weekday:"long", day:"numeric", month:"long", year:"numeric"})}</h2>
                <div className="flex gap-2">
                  <button onClick={()=>{ setKalSheetDate(selectedDate); setKalEditing(null); setJurnalDraft({judul:"",kegiatan:"",kendala:""}); setKeepFoto([]); setKalSheetOpen(true); }} className="rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background:"var(--palette-primary)" }}>+ Tulis jurnal baru</button>
                  <button onClick={refreshJurnal} className="text-xs font-bold px-3 py-1 rounded-full" style={{ color:"var(--palette-primary)", border:"1px solid var(--palette-border)" }}>Muat ulang</button>
                </div>
              </div>
              <p className="text-[11px] mb-2" style={{ color:"var(--palette-foreground-muted)" }}>Tap tanggal di kalender untuk filter — uraian tulis alat/bahan/hasil jadi satu komprehensif. Bisa lebih dari satu jurnal per hari. Foto 0-5 per jurnal.</p>
              {(() => { const filtered = jurnalReal.filter(j=> (j as any).tanggalIso === selectedDate); 
                if (filtered.length===0) return (<div className="rounded-2xl p-6 text-center" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)" }}><p className="text-[13px] font-bold" style={{ color:"var(--palette-foreground-muted)"}}>Belum ada jurnal di tanggal ini</p><p className="text-[11px] mt-1" style={{ color:"var(--palette-foreground-muted)"}}>Tap Tulis jurnal baru — tanggal otomatis {selectedDate}</p></div>);
                return (<div className="space-y-2">{
                  filtered.map((j) => (
                  <div key={j.id} className="rounded-2xl p-3.5" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)", boxShadow:"var(--elevation-level1)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-bold leading-tight line-clamp-2" style={{ color:"var(--palette-foreground-ink)" }}>{j.judul}</p>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background:"var(--palette-success-subtle)", color:"var(--palette-success)" }}>✓</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-snug line-clamp-3 whitespace-pre-wrap" style={{ color:"var(--palette-foreground-secondary)" }}>{String(j.kegiatan).slice(0,180)}{String(j.kegiatan).length>180?"…":""}</p>
                    {(j as unknown as { foto?: string[] }).foto && (j as unknown as { foto: string[] }).foto.length>0 && (
                      <div className="mt-2 flex gap-1.5 overflow-auto">
                        {(j as unknown as { foto: string[] }).foto.slice(0,5).map((src,i)=>(<img key={i} src={src} alt="doc" className="w-16 h-16 rounded-xl object-cover shrink-0" style={{ border:"1px solid var(--palette-border)" }} />))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-1.5">
                      <button onClick={async()=>{ const r=await fetch(`/api/jurnal/${j.id}/komentar`); const js=await r.json().catch(()=>({})); const k=Array.isArray(js.komentar)?js.komentar:[]; setDetailKomentar(k); setDetailJurnal({ id:j.id, judul:j.judul, kegiatan:j.kegiatan, kendala:(j as any).kendala ?? null, foto:(j as any).foto ?? [], tanggalIso:(j as any).tanggalIso }); setKomentarIsi(""); setReplyTo(null); }} className="flex-1 rounded-full py-2 text-[11px] font-bold" style={{ background:"var(--palette-primary-subtle)", color:"var(--palette-primary)", border:"1px solid var(--palette-primary-muted)" }}>Lihat & Komentar</button>
                      <button onClick={()=>{ openJurnalSheet((j as any).tanggalIso ?? selectedDate, { id:j.id, judul:j.judul, kegiatan:j.kegiatan, kendala:(j as any).kendala ?? null, foto:(j as any).foto ?? [], status:j.status, feedback:j.feedback }); }} className="flex-1 rounded-full py-2 text-[11px] font-bold" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)" }}>Edit</button>
                      <button onClick={async()=>{ if(!confirm(`Hapus jurnal "${j.judul}"?`)) return; const r=await fetch(`/api/jurnal/${j.id}`,{method:"DELETE"}); const js=await r.json().catch(()=>({})); if(!r.ok) return pop(js.error ?? "Gagal hapus"); pop("Jurnal dihapus ✓"); refreshJurnal(); }} className="flex-1 rounded-full py-2 text-[11px] font-bold" style={{ background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>Hapus</button>
                    </div>
                  </div>
                ))
                }</div>);
              })()
              }
              {detailJurnal && (
                <div className="fixed inset-0 z-50 bg-black/40 grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={()=>setDetailJurnal(null)}>
                  <div className="w-full max-w-[560px] max-h-[88vh] overflow-auto rounded-t-3xl sm:rounded-2xl bg-white p-4 sm:p-5" onClick={(e)=>e.stopPropagation()}>
                    <div className="flex justify-between items-start gap-2"><div><p className="text-[14px] font-bold leading-tight" style={{ color:"var(--palette-foreground-ink)" }}>{detailJurnal.judul}</p><p className="text-[11px] mt-0.5" style={{ color:"var(--palette-foreground-muted)" }}>{detailJurnal.tanggalIso ?? ""} {detailJurnal.kendala ? "· Kendala: "+detailJurnal.kendala : ""}</p></div><button onClick={()=>setDetailJurnal(null)} className="shrink-0 w-8 h-8 rounded-full grid place-items-center" style={{ background:"var(--palette-surface-muted)" }}>×</button></div>
                    <p className="mt-3 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color:"var(--palette-foreground-ink)" }}>{detailJurnal.kegiatan}</p>
                    {detailJurnal.foto?.length>0 && <div className="mt-3 grid grid-cols-3 gap-2">{detailJurnal.foto.slice(0,5).map((s,i)=>(<a key={i} href={s} target="_blank"><img src={s} alt="doc" className="w-full h-28 rounded-xl object-cover" style={{ border:"1px solid var(--palette-border)" }}/></a>))}</div>}
                    <div className="mt-4 pt-3" style={{ borderTop:"1px solid var(--palette-border)" }}>
                      <p className="text-[12px] font-bold">Komentar — tap komentar untuk balas</p>
                      <div className="mt-2 space-y-2 max-h-[30vh] overflow-auto pr-1">
                        {detailKomentar.length===0 ? <p className="text-[11px]" style={{ color:"var(--palette-foreground-muted)" }}>Belum ada komentar.</p> : detailKomentar.map(k=>(
                          <div key={k.id} onClick={()=>setReplyTo(k.id)} className={`rounded-2xl p-2.5 cursor-pointer ${replyTo===k.id ? "ring-2 ring-[var(--palette-primary)]":""}`} style={{ background: k.authorRole==="SISWA" ? "var(--palette-surface-muted)" : "var(--palette-primary-subtle)", border:"1px solid var(--palette-border)" }}>
                            <p className="text-[11px] font-bold">{k.authorName} <span className="font-normal" style={{ color:"var(--palette-foreground-muted)"}}>· {k.authorRole}</span> {k.parentId ? "↳ balas": ""}</p>
                            <p className="text-[12px] mt-0.5 whitespace-pre-wrap" style={{ color:"var(--palette-foreground-ink)" }}>{k.isi}</p>
                            <p className="text-[10px] mt-1" style={{ color:"var(--palette-foreground-muted)" }}>{new Date(k.createdAt).toLocaleString("id-ID")}</p>
                          </div>
                        ))}
                      </div>
                      {replyTo && <p className="text-[11px] mt-1">Balas ke <b>{detailKomentar.find(x=>x.id===replyTo)?.authorName ?? replyTo.slice(0,6)}</b> <button onClick={()=>setReplyTo(null)} className="underline" style={{ color:"var(--palette-primary)"}}>batal</button></p>}
                      <div className="mt-2 flex gap-2">
                        <input value={komentarIsi} onChange={e=>setKomentarIsi(e.target.value)} placeholder={replyTo ? "Tulis balasan..." : "Tulis komentar..."} className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none" style={{ border:"1px solid var(--palette-border)" }} />
                        <button onClick={async()=>{ if(komentarIsi.trim().length<2) return; const r=await fetch(`/api/jurnal/${detailJurnal.id}/komentar`,{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ isi:komentarIsi.trim(), parentId: replyTo })}); const js=await r.json().catch(()=>({})); if(!r.ok) return pop(js.error ?? "Gagal"); setKomentarIsi(""); setReplyTo(null); const r2=await fetch(`/api/jurnal/${detailJurnal.id}/komentar`); const j2=await r2.json().catch(()=>({})); setDetailKomentar(Array.isArray(j2.komentar)?j2.komentar:[]); pop("Komentar terkirim ✓"); }} className="rounded-full px-5 py-2.5 text-sm font-bold text-white shrink-0" style={{ background:"var(--palette-primary)" }}>Kirim</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <RiwayatAbsensi pop={pop} />
          </div>
        )}

        {tab === "profil" && (
          <div className="space-y-4">
            <div className="rounded-3xl p-5" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)", boxShadow:"var(--elevation-level1)" }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={profilData?.foto ?? "/logo-hassina.jpg"} alt="foto" className="w-16 h-16 rounded-full object-cover" style={{ border:"2px solid var(--palette-border)" }} />
                  <button onClick={async()=>{ const inp=document.createElement("input"); inp.type="file"; inp.accept="image/*"; inp.onchange=async()=>{ const f=(inp.files as FileList | null)?.[0]; if(!f) return; if(!f.type.startsWith("image/")) return alert("Pilih gambar."); if(f.size>5*1024*1024) return alert("Maks 5MB."); const fd=new FormData(); fd.set("foto", f); const r=await fetch("/api/siswa/profil/foto",{method:"POST", body:fd}); const j=await r.json().catch(()=>({})); if(!r.ok) return alert(j.error ?? "Gagal"); setProfilData((prev:any)=> prev ? { ...prev, foto: j.foto } : prev); alert("Foto diperbarui ✓"); }; inp.click(); }} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full grid place-items-center text-white text-[12px]" style={{ background:"var(--palette-primary)" }}>📷</button>
                </div>
                <div className="min-w-0 flex-1"><p className="text-[14px] font-bold truncate" style={{ color:"var(--palette-foreground-ink)" }}>{profilData?.name ?? "—"}</p><p className="text-[11px] truncate" style={{ color:"var(--palette-foreground-muted)" }}>{profilData?.kelas ?? ""} · {profilData?.nis ?? ""} · {profilData?.jurusan ?? ""}</p>{profilData?.dudi && <p className="text-[11px] truncate" style={{ color:"var(--palette-foreground-muted)" }}>DUDI: {profilData.dudi.name} — {profilData.dudi.alamat}</p>}</div>
                <button onClick={()=>setProfilEditOpen(v=>!v)} className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold" style={{ background:"var(--palette-primary-subtle)", color:"var(--palette-primary)", border:"1px solid var(--palette-border)" }}>{profilEditOpen ? "Tutup" : "Edit"}</button>
              </div>
              {profilEditOpen && (
                <div className="mt-4 grid gap-2">
                  <input value={profilDraft.name} onChange={e=>setProfilDraft({...profilDraft, name:e.target.value})} placeholder="Nama" className="w-full rounded-full px-4 py-2.5 text-sm outline-none" style={{ border:"1px solid var(--palette-border)" }} />
                  <div className="grid grid-cols-2 gap-2"><input value={profilDraft.kelas} onChange={e=>setProfilDraft({...profilDraft, kelas:e.target.value})} placeholder="Kelas" className="rounded-full px-4 py-2.5 text-sm outline-none" style={{ border:"1px solid var(--palette-border)" }} /><input value={profilDraft.jurusan} onChange={e=>setProfilDraft({...profilDraft, jurusan:e.target.value})} placeholder="Jurusan" className="rounded-full px-4 py-2.5 text-sm outline-none" style={{ border:"1px solid var(--palette-border)" }} /></div>
                  <input value={profilDraft.noHp} onChange={e=>setProfilDraft({...profilDraft, noHp:e.target.value})} placeholder="No HP" className="w-full rounded-full px-4 py-2.5 text-sm outline-none" style={{ border:"1px solid var(--palette-border)" }} />
                  <button onClick={async()=>{ const r=await fetch("/api/siswa/profil",{method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(profilDraft)}); const j=await r.json().catch(()=>({})); if(!r.ok) return alert(j.error ?? "Gagal"); setProfilData(j.data); setProfilEditOpen(false); alert("Profil diperbarui ✓"); }} className="rounded-full py-2.5 text-sm font-bold text-white" style={{ background:"var(--palette-primary)" }}>Simpan profil</button>
                  <div className="grid grid-cols-2 gap-2"><button onClick={()=>router.push("/ganti-password")} className="rounded-full py-2.5 text-[12px] font-bold" style={{ border:"1px solid var(--palette-border)" }}>Ganti password</button><button onClick={()=>signOut({callbackUrl:"/login"})} className="rounded-full py-2.5 text-[12px] font-bold" style={{ background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>Keluar</button></div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* bottom nav — Pulse glass-pill (Beranda/Absensi/Jurnal/Profil) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[86%] max-w-[360px] z-30">
        <div className="rounded-full py-3 px-6 flex justify-between items-center shadow-lg" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
          <button onClick={() => setTab("beranda")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "beranda" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="house" className="w-5 h-5" /></button>
          <button onClick={() => setTab("absensi")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "absensi" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="calendar-check" className="w-5 h-5" /></button>
          <button onClick={() => setTab("jurnal")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "jurnal" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="notebook-pen" className="w-5 h-5" /></button>
          <button onClick={() => setTab("profil")} className="w-10 h-10 rounded-full grid place-items-center" style={tab === "profil" ? { background: "var(--palette-primary-subtle)", color: "var(--palette-primary)" } : { color: "var(--palette-foreground-muted)" }}><i data-lucide="user" className="w-5 h-5" /></button>
        </div>
      </div>

      {toast && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-[86%] max-w-[360px]"><div className="rounded-2xl px-4 py-3 text-[13px] font-medium text-white shadow-xl text-center" style={{ background: "var(--palette-foreground-ink)" }}>{toast}</div></div>}
    </div>


  );
}

function RecapCard() {
  const [data, setData] = React.useState<{hadir:number; izin:number; sakit:number; alpha:number}|null>(null);
  React.useEffect(()=>{ (async()=>{
    try{
      const now=new Date(); const from=new Date(now); from.setDate(now.getDate()-30);
      const qs=`from=${from.toISOString().slice(0,10)}&to=${now.toISOString().slice(0,10)}`;
      const r=await fetch(`/api/absensi?${qs}`); const j=await r.json().catch(()=>({}));
      const arr=Array.isArray(j.data)? j.data: [];
      const hadir=arr.filter((x:any)=>x.status==="HADIR").length;
      const izin=arr.filter((x:any)=>x.status==="IZIN").length;
      const sakit=arr.filter((x:any)=>x.status==="SAKIT").length;
      const alpha=arr.filter((x:any)=>x.status==="ALPHA").length;
      setData({hadir, izin, sakit, alpha});
    }catch{ setData({hadir:0, izin:0, sakit:0, alpha:0}); }
  })(); },[]);
  if(!data) return <div className="rounded-2xl p-4 animate-pulse" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)" }}><p className="text-sm font-bold">Rekap 30 hari</p><p className="text-xs" style={{ color:"var(--palette-foreground-muted)"}}>Memuat...</p></div>;
  return (
    <div className="rounded-2xl p-4" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)", boxShadow:"var(--elevation-level1)" }}>
      <p className="text-[13px] font-bold" style={{ color:"var(--palette-foreground-ink)" }}>Rekap 30 hari</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="rounded-xl p-2.5 text-center" style={{ background:"var(--palette-success-subtle)" }}><p className="text-[18px] font-extrabold" style={{ color:"var(--palette-success)" }}>{data.hadir}</p><p className="text-[10px] font-bold" style={{ color:"var(--palette-success)" }}>Hadir</p></div>
        <div className="rounded-xl p-2.5 text-center" style={{ background:"#fef3c7" }}><p className="text-[18px] font-extrabold" style={{ color:"#92400e" }}>{data.izin}</p><p className="text-[10px] font-bold" style={{ color:"#92400e" }}>Izin</p></div>
        <div className="rounded-xl p-2.5 text-center" style={{ background:"#fee2e2" }}><p className="text-[18px] font-extrabold" style={{ color:"#dc2626" }}>{data.sakit}</p><p className="text-[10px] font-bold" style={{ color:"#dc2626" }}>Sakit</p></div>
        <div className="rounded-xl p-2.5 text-center" style={{ background:"#f3f4f6" }}><p className="text-[18px] font-extrabold" style={{ color:"var(--palette-foreground-muted)" }}>{data.alpha}</p><p className="text-[10px] font-bold" style={{ color:"var(--palette-foreground-muted)" }}>Alpha</p></div>
      </div>
    </div>
  );
}
function RekomendasiHarian({ onJurnalCreated }: { onJurnalCreated: ()=>void }) {
  const [items, setItems] = React.useState<Array<{judul:string; ringkasan:string; tingkat:string; alat:string[]; bahan:string[]; langkah:string[]; durasiMenit:number}>>([]);
  const [loading, setLoading] = React.useState(true);
  const [openIdx, setOpenIdx] = React.useState<number|null>(null);
  const [kerjakan, setKerjakan] = React.useState<number|null>(null);
  const [checks, setChecks] = React.useState<boolean[]>([]);
  const [fotoFiles, setFotoFiles] = React.useState<FileList|null>(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(()=>{ (async()=>{
    try{
      const r=await fetch("/api/rekomendasi"); const j=await r.json().catch(()=>({}));
      if(Array.isArray(j.items)) setItems(j.items.slice(0,5));
    }catch{} finally{ setLoading(false); }
  })(); },[]);
  if(loading) return <div className="rounded-2xl p-4" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)" }}><p className="text-sm font-bold">Rekomendasi AI</p><p className="text-xs" style={{ color:"var(--palette-foreground-muted)"}}>Memuat rekomendasi...</p></div>;
  if(items.length===0) return <div className="rounded-2xl p-4" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)" }}><p className="text-sm font-bold">Rekomendasi AI</p><p className="text-xs" style={{ color:"var(--palette-foreground-muted)"}}>Belum ada rekomendasi hari ini.</p></div>;
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background:"linear-gradient(135deg,#ede9fe 0%,#e0e7ff 50%,#ddd6fe 100%)", border:"1px solid var(--palette-border)" }}>
      <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full grid place-items-center text-white text-[12px]" style={{ background:"var(--palette-primary)" }}>✦</span><p className="text-[13px] font-bold" style={{ color:"var(--palette-foreground-ink)" }}>Rekomendasi AI hari ini</p><span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full" style={{ background:"white", color:"var(--palette-primary)" }}>{items.length}/5</span></div>
      {items.map((it,i)=>(
        <div key={i} className="rounded-2xl p-3.5" style={{ background:"white", border:"1px solid var(--palette-border)", boxShadow:"var(--elevation-level1)" }}>
          <div className="flex gap-2 items-start"><p className="flex-1 text-[13px] font-bold leading-tight" style={{ color:"var(--palette-foreground-ink)" }}>{it.judul}</p><span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: it.tingkat==="Mudah" ? "#dcfce7" : it.tingkat==="Sulit" ? "#fee2e2" : "#fef3c7", color: it.tingkat==="Mudah" ? "#166534" : it.tingkat==="Sulit" ? "#dc2626" : "#92400e" }}>{it.tingkat}</span></div>
          <p className="mt-1 text-[11px] leading-snug" style={{ color:"var(--palette-foreground-secondary)" }}>{it.ringkasan} · {it.durasiMenit}m</p>
          <div className="mt-2 flex gap-1.5">
            <button onClick={()=>setOpenIdx(openIdx===i ? null : i)} className="flex-1 rounded-full py-2 text-[11px] font-bold" style={{ background:"var(--palette-surface-muted)", border:"1px solid var(--palette-border)" }}>{openIdx===i ? "Tutup" : "Detail"}</button>
            <button onClick={()=>{ setKerjakan(i); setChecks(Array(it.langkah.length).fill(false)); setFotoFiles(null); }} className="flex-1 rounded-full py-2 text-[11px] font-bold text-white" style={{ background:"var(--palette-primary)" }}>Kerjakan</button>
          </div>
          {openIdx===i && (
            <div className="mt-3 space-y-2 text-[12px]">
              <p><b>Alat:</b> {it.alat.join(", ") || "-"}</p>
              <p><b>Bahan:</b> {it.bahan.join(", ") || "-"}</p>
              <ol className="list-decimal pl-5 space-y-1">{it.langkah.map((s,k)=><li key={k}>{s}</li>)}</ol>
            </div>
          )}
          {kerjakan===i && (
            <div className="mt-3 p-3 rounded-2xl" style={{ background:"var(--palette-surface-muted)", border:"1px solid var(--palette-border)" }}>
              <p className="text-[12px] font-bold">Kerjakan — checklist & foto</p>
              <div className="mt-2 space-y-1.5">{it.langkah.map((s,k)=>(
                <label key={k} className="flex gap-2 text-[12px]"><input type="checkbox" checked={!!checks[k]} onChange={e=>{ const n=[...checks]; n[k]=e.target.checked; setChecks(n); }} />{s}</label>
              ))}</div>
              <div className="mt-3 flex gap-2">
                <input type="file" accept="image/*" multiple onChange={e=>setFotoFiles(e.target.files)} className="flex-1 text-[11px] file:mr-2 file:rounded-full file:border-0 file:bg-[var(--palette-primary)] file:text-white file:px-3 file:py-1.5" />
                <button disabled={busy || checks.some(v=>!v) || !fotoFiles || fotoFiles.length===0} onClick={async()=>{
                  if(checks.some(v=>!v)) return alert("Centang semua langkah dulu.");
                  const files=fotoFiles ? Array.from(fotoFiles).slice(0,5) : [];
                  if(files.length===0) return alert("Upload minimal 1 foto.");
                  setBusy(true);
                  try{
                    const today=new Date().toLocaleString("en-CA",{timeZone:"Asia/Jakarta"}).slice(0,10);
                    const fd=new FormData(); fd.set("tanggal", today); fd.set("idx", String(i)); fd.set("checklist", JSON.stringify(checks));
                    for(const f of files) fd.append("foto", f);
                    const r=await fetch("/api/jurnal/from-rekomendasi",{method:"POST", body:fd});
                    const j=await r.json().catch(()=>({})); if(!r.ok) return alert(j.error ?? "Gagal");
                    alert("Jurnal dari rekomendasi ditambahkan ✓"); setKerjakan(null); onJurnalCreated();
                  }finally{ setBusy(false); }
                }} className="rounded-full px-4 py-2 text-[11px] font-bold text-white disabled:opacity-40" style={{ background:"var(--palette-primary)" }}>{busy?"...":"Simpan ke jurnal ✓"}</button>
              </div>
              <button onClick={()=>setKerjakan(null)} className="mt-2 text-[11px] underline" style={{ color:"var(--palette-foreground-muted)"}}>Batal</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
function AbsensiModern(props: { profilData: unknown; absenBusy: boolean; triggerAbsen: (m: "masuk" | "pulang")=>void; pop: (m: string)=>void }) {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)", boxShadow:"var(--elevation-level1)" }}>
      <p className="text-[13px] font-bold" style={{ color:"var(--palette-foreground-ink)" }}>Absensi hari ini</p>
      <div className="grid grid-cols-2 gap-2">
        <button disabled={props.absenBusy} onClick={()=>props.triggerAbsen("masuk")} className="rounded-full py-3 text-sm font-bold text-white disabled:opacity-40" style={{ background:"var(--palette-primary)" }}>{props.absenBusy?"...":"Masuk · selfie GPS"}</button>
        <button disabled={props.absenBusy} onClick={()=>props.triggerAbsen("pulang")} className="rounded-full py-3 text-sm font-bold" style={{ background:"white", border:"1px solid var(--palette-border)" }}>Pulang</button>
      </div>
    </div>
  );
}
function RiwayatAbsensi(props: { pop: (m: string)=>void }) {
  const [rows, setRows] = React.useState<Array<{tanggal:string; status:string}>>([]);
  React.useEffect(()=>{ (async()=>{
    try{
      const now=new Date(); const from=new Date(now); from.setDate(now.getDate()-14);
      const qs=`from=${from.toISOString().slice(0,10)}&to=${now.toISOString().slice(0,10)}`;
      const r=await fetch(`/api/absensi?${qs}`); const j=await r.json().catch(()=>({}));
      if(Array.isArray(j.data)) setRows(j.data.map((x:any)=>({ tanggal: x.tanggalIso ?? x.tanggal, status: x.status })));
    }catch{}
  })(); },[]);
  if(rows.length===0) return null;
  return (
    <div className="rounded-2xl p-4" style={{ background:"var(--palette-surface)", border:"1px solid var(--palette-border)", boxShadow:"var(--elevation-level1)" }}>
      <p className="text-[13px] font-bold" style={{ color:"var(--palette-foreground-ink)" }}>Riwayat 14 hari</p>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px]">{rows.slice(0,14).map((r,i)=><div key={i} className="rounded-lg py-1.5" style={{ background: r.status==="HADIR" ? "var(--palette-success-subtle)" : r.status==="ALPHA" ? "#fef2f2" : "var(--palette-surface-muted)" }}>{r.tanggal.slice(5)}</div>)}</div>
    </div>
  );
}
